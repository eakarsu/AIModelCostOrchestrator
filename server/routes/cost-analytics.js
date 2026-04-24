const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/cost-analytics
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_analytics ORDER BY date DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get cost analytics error:', error);
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
router.post('/ai/insights', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cost_analytics ORDER BY date DESC LIMIT 10');

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
            content: 'You are an AI cost analytics expert. Analyze cost data and provide actionable insights on spending patterns, cost anomalies, and optimization opportunities. Focus on identifying trends, outliers, and potential savings.'
          },
          {
            role: 'user',
            content: (prompt || 'Analyze these cost analytics and provide insights on spending patterns and optimization opportunities.') + '\n\nContext data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
