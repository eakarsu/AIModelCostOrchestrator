const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/cost-analytics
router.get('/', auth, async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const result = await pool.query(
        'SELECT * FROM cost_analytics ORDER BY date DESC, created_at DESC LIMIT $1 OFFSET $2',
        [parseInt(limit), offset]
      );
      const count = await pool.query('SELECT COUNT(*) FROM cost_analytics');
      return res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
    }
    const result = await pool.query('SELECT * FROM cost_analytics ORDER BY date DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get cost analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cost-analytics/summary - spend by model and daily trend
router.get('/summary', auth, async (req, res) => {
  try {
    const byModel = await pool.query(
      `SELECT model_name, SUM(total_cost) as total_cost, SUM(tokens_used) as total_tokens, SUM(request_count) as total_requests
       FROM cost_analytics GROUP BY model_name ORDER BY total_cost DESC`
    );
    const byDept = await pool.query(
      `SELECT department, SUM(total_cost) as total_cost FROM cost_analytics GROUP BY department ORDER BY total_cost DESC`
    );
    const daily = await pool.query(
      `SELECT date, SUM(total_cost) as total_cost FROM cost_analytics
       WHERE date >= NOW() - INTERVAL '30 days' GROUP BY date ORDER BY date ASC`
    );
    res.json({ success: true, data: { byModel: byModel.rows, byDepartment: byDept.rows, daily: daily.rows } });
  } catch (error) {
    console.error('Cost analytics summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cost-analytics/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_analytics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get cost analytic error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cost-analytics
router.post('/', auth, async (req, res) => {
  try {
    const { model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency } = req.body;
    if (!model_name || !department || !date || !tokens_used || total_cost === undefined) {
      return res.status(400).json({ success: false, error: 'model_name, department, date, tokens_used, and total_cost are required' });
    }
    const result = await pool.query(
      `INSERT INTO cost_analytics (model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create cost analytic error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/cost-analytics/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency } = req.body;
    const result = await pool.query(
      `UPDATE cost_analytics SET model_name = $1, department = $2, date = $3, tokens_used = $4, input_tokens = $5,
       output_tokens = $6, total_cost = $7, request_count = $8, avg_latency = $9
       WHERE id = $10 RETURNING *`,
      [model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update cost analytic error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/cost-analytics/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cost_analytics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete cost analytic error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cost-analytics/ai/insights
router.post('/ai/insights', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cost_analytics ORDER BY date DESC LIMIT 10');

    const systemPrompt = `You are an AI cost analytics expert. Analyze cost data and provide actionable insights. Return JSON only: { total_spend, top_cost_driver, optimization_opportunities: [{action, estimated_savings_pct}], budget_status: "on_track|over|under" }`;
    const userContent = (prompt || 'Analyze these cost analytics and provide insights on spending patterns and optimization opportunities.') + '\n\nContext data: ' + JSON.stringify(data.rows);

    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'cost-analytics', { prompt, data: data.rows }, text);

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
