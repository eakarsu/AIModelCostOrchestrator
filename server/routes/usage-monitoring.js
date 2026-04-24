const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/usage-monitoring
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usage_monitoring ORDER BY last_active DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get usage monitoring error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/usage-monitoring/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usage_monitoring WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get usage record error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/usage-monitoring
router.post('/', auth, async (req, res) => {
  try {
    const { service_name, model_name, endpoint, requests_today, tokens_today, cost_today, error_rate, avg_response_time, status, last_active } = req.body;
    const result = await pool.query(
      `INSERT INTO usage_monitoring (service_name, model_name, endpoint, requests_today, tokens_today, cost_today, error_rate, avg_response_time, status, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [service_name, model_name, endpoint, requests_today, tokens_today, cost_today, error_rate, avg_response_time, status || 'active', last_active || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create usage record error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/usage-monitoring/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { service_name, model_name, endpoint, requests_today, tokens_today, cost_today, error_rate, avg_response_time, status, last_active } = req.body;
    const result = await pool.query(
      `UPDATE usage_monitoring SET service_name = $1, model_name = $2, endpoint = $3, requests_today = $4, tokens_today = $5,
       cost_today = $6, error_rate = $7, avg_response_time = $8, status = $9, last_active = $10
       WHERE id = $11 RETURNING *`,
      [service_name, model_name, endpoint, requests_today, tokens_today, cost_today, error_rate, avg_response_time, status, last_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update usage record error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/usage-monitoring/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM usage_monitoring WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete usage record error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/usage-monitoring/ai/anomalies
router.post('/ai/anomalies', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM usage_monitoring ORDER BY cost_today DESC LIMIT 10');

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
            content: 'You are an AI usage monitoring expert. Detect anomalies in API usage patterns including unusual spikes in requests, tokens, costs, or error rates. Flag potential issues and provide recommendations for investigation and remediation.'
          },
          {
            role: 'user',
            content: (prompt || 'Detect any anomalies in the current usage monitoring data and flag potential issues.') + '\n\nUsage data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI anomalies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
