const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/cache-management
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cache_management ORDER BY last_accessed DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get cache entries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cache-management/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cache_management WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cache entry not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get cache entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cache-management
router.post('/', auth, async (req, res) => {
  try {
    const { cache_key, endpoint, hit_count, miss_count, hit_rate_pct, memory_used_mb, ttl_seconds, cost_saved, status, last_accessed } = req.body;
    const result = await pool.query(
      `INSERT INTO cache_management (cache_key, endpoint, hit_count, miss_count, hit_rate_pct, memory_used_mb, ttl_seconds, cost_saved, status, last_accessed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [cache_key, endpoint, hit_count || 0, miss_count || 0, hit_rate_pct || 0, memory_used_mb || 0, ttl_seconds || 3600, cost_saved || 0, status || 'active', last_accessed || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create cache entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/cache-management/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { cache_key, endpoint, hit_count, miss_count, hit_rate_pct, memory_used_mb, ttl_seconds, cost_saved, status, last_accessed } = req.body;
    const result = await pool.query(
      `UPDATE cache_management SET cache_key = $1, endpoint = $2, hit_count = $3, miss_count = $4, hit_rate_pct = $5,
       memory_used_mb = $6, ttl_seconds = $7, cost_saved = $8, status = $9, last_accessed = $10
       WHERE id = $11 RETURNING *`,
      [cache_key, endpoint, hit_count, miss_count, hit_rate_pct, memory_used_mb, ttl_seconds, cost_saved, status, last_accessed, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cache entry not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update cache entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/cache-management/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cache_management WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cache entry not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete cache entry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cache-management/ai/strategy
router.post('/ai/strategy', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cache_management ORDER BY cost_saved DESC LIMIT 10');

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
            content: 'You are an AI caching strategy expert. Analyze cache performance data and suggest optimal caching strategies to reduce AI API costs. Consider TTL optimization, cache key design, memory management, and cache invalidation patterns.'
          },
          {
            role: 'user',
            content: (prompt || 'Suggest an optimal caching strategy based on current cache performance data.') + '\n\nCache data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI strategy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
