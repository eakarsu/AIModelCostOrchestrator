const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/models - List all models
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_models ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/models/:id - Get single model
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_models WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get model error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/models - Create new model
router.post('/', auth, async (req, res) => {
  try {
    const { name, provider, model_id, cost_per_1k_input, cost_per_1k_output, avg_latency_ms, quality_score, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO ai_models (name, provider, model_id, cost_per_1k_input, cost_per_1k_output, avg_latency_ms, quality_score, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, provider, model_id, cost_per_1k_input, cost_per_1k_output, avg_latency_ms, quality_score, is_active !== false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create model error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/models/:id - Update model
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, provider, model_id, cost_per_1k_input, cost_per_1k_output, avg_latency_ms, quality_score, is_active } = req.body;
    const result = await pool.query(
      `UPDATE ai_models SET name = $1, provider = $2, model_id = $3, cost_per_1k_input = $4, cost_per_1k_output = $5,
       avg_latency_ms = $6, quality_score = $7, is_active = $8, updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [name, provider, model_id, cost_per_1k_input, cost_per_1k_output, avg_latency_ms, quality_score, is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update model error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/models/:id - Delete model
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ai_models WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/models/ai/analyze - AI analyzes model cost-effectiveness
router.post('/ai/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM ai_models ORDER BY cost_per_1k_input ASC LIMIT 10');
    const systemPrompt = `You are an AI cost optimization expert. Analyze model cost-effectiveness and provide recommendations. Return JSON: { best_value_model, cost_analysis: [{model, value_score}], recommendations: [] }`;
    const userContent = (prompt || 'Provide analysis based on the data.') + '\n\nData: ' + JSON.stringify(data.rows);
    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'models', { prompt, data: data.rows }, text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
