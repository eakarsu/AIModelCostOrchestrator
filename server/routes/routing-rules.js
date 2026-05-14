const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/routing-rules
router.get('/', auth, async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const result = await pool.query(
        'SELECT * FROM routing_rules ORDER BY priority ASC, created_at DESC LIMIT $1 OFFSET $2',
        [parseInt(limit), offset]
      );
      const count = await pool.query('SELECT COUNT(*) FROM routing_rules');
      return res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
    }
    const result = await pool.query('SELECT * FROM routing_rules ORDER BY priority ASC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get routing rules error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/routing-rules/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM routing_rules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Routing rule not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get routing rule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/routing-rules
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, condition_type, condition_value, target_model, fallback_model, priority, is_active, requests_routed, cost_saved } = req.body;
    if (!name || !condition_type || !condition_value || !target_model) {
      return res.status(400).json({ success: false, error: 'name, condition_type, condition_value, and target_model are required' });
    }
    const result = await pool.query(
      `INSERT INTO routing_rules (name, description, condition_type, condition_value, target_model, fallback_model, priority, is_active, requests_routed, cost_saved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, description, condition_type, condition_value, target_model, fallback_model, priority || 1, is_active !== false, requests_routed || 0, cost_saved || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create routing rule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/routing-rules/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, condition_type, condition_value, target_model, fallback_model, priority, is_active, requests_routed, cost_saved } = req.body;
    const result = await pool.query(
      `UPDATE routing_rules SET name = $1, description = $2, condition_type = $3, condition_value = $4, target_model = $5,
       fallback_model = $6, priority = $7, is_active = $8, requests_routed = $9, cost_saved = $10
       WHERE id = $11 RETURNING *`,
      [name, description, condition_type, condition_value, target_model, fallback_model, priority, is_active, requests_routed, cost_saved, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Routing rule not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update routing rule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/routing-rules/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM routing_rules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Routing rule not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete routing rule error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/routing-rules/ai/suggest
router.post('/ai/suggest', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM routing_rules ORDER BY cost_saved DESC LIMIT 10');

    const systemPrompt = `You are an AI model routing expert. Suggest intelligent routing rules that direct requests to the most cost-effective model based on task complexity, latency requirements, and quality needs. Return JSON only: { recommended_model, alternative_model, cost_savings_estimate, routing_criteria, confidence }`;
    const userContent = (prompt || 'Suggest new routing rules to optimize model selection and reduce costs.') + '\n\nCurrent routing rules: ' + JSON.stringify(data.rows);

    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'routing-rules', { prompt, rules: data.rows }, text);

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI suggest error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
