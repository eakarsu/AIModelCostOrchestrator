const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/rate-limiting
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rate_limiting ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get rate limits error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/rate-limiting/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rate_limiting WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rate limit not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get rate limit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/rate-limiting
router.post('/', auth, async (req, res) => {
  try {
    const { name, service, tier, requests_per_minute, requests_per_hour, tokens_per_minute, burst_limit, current_usage_pct, throttled_count, status } = req.body;
    const result = await pool.query(
      `INSERT INTO rate_limiting (name, service, tier, requests_per_minute, requests_per_hour, tokens_per_minute, burst_limit, current_usage_pct, throttled_count, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, service, tier || 'standard', requests_per_minute, requests_per_hour, tokens_per_minute, burst_limit, current_usage_pct || 0, throttled_count || 0, status || 'active']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create rate limit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/rate-limiting/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, service, tier, requests_per_minute, requests_per_hour, tokens_per_minute, burst_limit, current_usage_pct, throttled_count, status } = req.body;
    const result = await pool.query(
      `UPDATE rate_limiting SET name = $1, service = $2, tier = $3, requests_per_minute = $4, requests_per_hour = $5,
       tokens_per_minute = $6, burst_limit = $7, current_usage_pct = $8, throttled_count = $9, status = $10
       WHERE id = $11 RETURNING *`,
      [name, service, tier, requests_per_minute, requests_per_hour, tokens_per_minute, burst_limit, current_usage_pct, throttled_count, status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rate limit not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update rate limit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/rate-limiting/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM rate_limiting WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rate limit not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete rate limit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/rate-limiting/ai/recommend
router.post('/ai/recommend', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM rate_limiting ORDER BY current_usage_pct DESC LIMIT 10');

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
            content: 'You are an AI rate limiting expert. Analyze current rate limiting policies and usage patterns to recommend optimal rate limits. Balance cost control with service availability. Consider burst handling, tier-based limits, and graceful degradation strategies.'
          },
          {
            role: 'user',
            content: (prompt || 'Recommend optimal rate limiting policies based on current usage patterns.') + '\n\nRate limiting data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI recommend error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
