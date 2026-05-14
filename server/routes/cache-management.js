const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

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
router.post('/ai/strategy', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cache_management ORDER BY cost_saved DESC LIMIT 10');
    const systemPrompt = `You are a caching strategy expert. Suggest optimal caching strategies to reduce AI costs. Return JSON: { recommended_ttl_seconds, expected_hit_rate_pct, cost_savings_pct, strategy_description }`;
    const userContent = (prompt || 'Provide analysis based on the data.') + '\n\nData: ' + JSON.stringify(data.rows);
    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'cache-management', { prompt, data: data.rows }, text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI strategy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
