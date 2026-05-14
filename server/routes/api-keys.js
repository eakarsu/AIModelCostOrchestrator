const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/api-keys
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM api_keys ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get api keys error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/api-keys/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM api_keys WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get api key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/api-keys
router.post('/', auth, async (req, res) => {
  try {
    const { name, provider, key_prefix, environment, usage_limit, current_usage, rate_limit, status, last_used, expires_at } = req.body;
    const result = await pool.query(
      `INSERT INTO api_keys (name, provider, key_prefix, environment, usage_limit, current_usage, rate_limit, status, last_used, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, provider, key_prefix, environment || 'production', usage_limit, current_usage || 0, rate_limit, status || 'active', last_used, expires_at]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create api key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/api-keys/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, provider, key_prefix, environment, usage_limit, current_usage, rate_limit, status, last_used, expires_at } = req.body;
    const result = await pool.query(
      `UPDATE api_keys SET name = $1, provider = $2, key_prefix = $3, environment = $4, usage_limit = $5,
       current_usage = $6, rate_limit = $7, status = $8, last_used = $9, expires_at = $10
       WHERE id = $11 RETURNING *`,
      [name, provider, key_prefix, environment, usage_limit, current_usage, rate_limit, status, last_used, expires_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update api key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/api-keys/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM api_keys WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'API key not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete api key error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/api-keys/ai/audit
router.post('/ai/audit', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM api_keys ORDER BY current_usage DESC LIMIT 10');
    const systemPrompt = `You are an API security expert. Audit API key usage and identify security concerns. Return JSON: { risk_score: 0-100, issues: [{key_name, issue, severity}], recommendations: [] }`;
    const userContent = (prompt || 'Provide analysis based on the data.') + '\n\nData: ' + JSON.stringify(data.rows);
    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'api-keys', { prompt, data: data.rows }, text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI audit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
