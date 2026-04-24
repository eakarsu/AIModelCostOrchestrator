const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

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
router.post('/ai/forecast', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM budget_alerts ORDER BY current_spend DESC LIMIT 10');

    const response = await fetch(process.env.OPENROUTER_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Cost Orchestrator'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an AI budget forecasting expert. Analyze budget alerts and spending patterns to forecast future budget usage. Identify departments at risk of exceeding budgets and provide proactive recommendations to stay within limits.'
          },
          {
            role: 'user',
            content: (prompt || 'Forecast budget usage based on current spending patterns and alert which departments may exceed their limits.') + '\n\nBudget data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI forecast error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
