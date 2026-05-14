const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/budget-alerts/check - compare current month spend to thresholds
router.get('/check', auth, async (req, res) => {
  try {
    const alerts = await pool.query('SELECT * FROM budget_alerts WHERE status = $1', ['active']);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const results = await Promise.all(alerts.rows.map(async (alert) => {
      const spendResult = await pool.query(
        `SELECT COALESCE(SUM(total_cost), 0) as spent FROM cost_analytics
         WHERE department = $1 AND date >= $2`,
        [alert.department, monthStart.toISOString()]
      );
      const spent = parseFloat(spendResult.rows[0].spent);
      const threshold = parseFloat(alert.budget_limit);
      const over_by = spent > threshold ? spent - threshold : 0;

      // Trigger alert if over budget
      if (spent > threshold && !alert.notified_at) {
        await pool.query(
          'UPDATE budget_alerts SET notified_at = NOW(), status = $1 WHERE id = $2',
          ['triggered', alert.id]
        );
      }

      return {
        id: alert.id,
        name: alert.name,
        department: alert.department,
        threshold,
        spent: parseFloat(spent.toFixed(4)),
        over_by: parseFloat(over_by.toFixed(4)),
        pct_used: threshold > 0 ? parseFloat(((spent / threshold) * 100).toFixed(1)) : 0,
        status: spent > threshold ? 'over' : spent > threshold * (alert.alert_threshold_pct / 100) ? 'warning' : 'under',
      };
    }));

    res.json({ success: true, alerts: results });
  } catch (error) {
    console.error('Budget alert check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/budget-alerts
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budget_alerts ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get budget alerts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/budget-alerts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budget_alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget alert not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get budget alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/budget-alerts
router.post('/', auth, async (req, res) => {
  try {
    const { name, department, budget_limit, current_spend, alert_threshold_pct, alert_type, status, period, notified_at } = req.body;
    if (!name || !department || budget_limit === undefined) {
      return res.status(400).json({ success: false, error: 'name, department, and budget_limit are required' });
    }
    const result = await pool.query(
      `INSERT INTO budget_alerts (name, department, budget_limit, current_spend, alert_threshold_pct, alert_type, status, period, notified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, department, budget_limit, current_spend || 0, alert_threshold_pct || 80, alert_type || 'warning', status || 'active', period || 'monthly', notified_at]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create budget alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/budget-alerts/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, department, budget_limit, current_spend, alert_threshold_pct, alert_type, status, period, notified_at } = req.body;
    const result = await pool.query(
      `UPDATE budget_alerts SET name = $1, department = $2, budget_limit = $3, current_spend = $4, alert_threshold_pct = $5,
       alert_type = $6, status = $7, period = $8, notified_at = $9
       WHERE id = $10 RETURNING *`,
      [name, department, budget_limit, current_spend, alert_threshold_pct, alert_type, status, period, notified_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget alert not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update budget alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/budget-alerts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM budget_alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Budget alert not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete budget alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/budget-alerts/ai/forecast
router.post('/ai/forecast', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM budget_alerts ORDER BY current_spend DESC LIMIT 10');

    const systemPrompt = `You are an AI budget forecasting expert. Analyze budget alerts and spending patterns to forecast future budget usage. Return JSON only: { at_risk_departments: [{ department, risk_level, projected_overage }], recommended_adjustments: [{ department, action }], overall_health: "good|warning|critical" }`;
    const userContent = (prompt || 'Forecast budget usage based on current spending patterns and alert which departments may exceed their limits.') + '\n\nBudget data: ' + JSON.stringify(data.rows);

    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'budget-alerts', { prompt, data: data.rows }, text);

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI forecast error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
