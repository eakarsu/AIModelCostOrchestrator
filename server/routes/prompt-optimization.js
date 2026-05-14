const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/prompt-optimization
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prompt_optimization ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get prompt optimizations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prompt-optimization/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM prompt_optimization WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prompt optimization not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get prompt optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prompt-optimization
router.post('/', auth, async (req, res) => {
  try {
    const { name, original_prompt, optimized_prompt, original_tokens, optimized_tokens, token_reduction_pct, quality_maintained, model_used, category } = req.body;
    const result = await pool.query(
      `INSERT INTO prompt_optimization (name, original_prompt, optimized_prompt, original_tokens, optimized_tokens, token_reduction_pct, quality_maintained, model_used, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, original_prompt, optimized_prompt, original_tokens, optimized_tokens, token_reduction_pct, quality_maintained !== false, model_used, category]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create prompt optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/prompt-optimization/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, original_prompt, optimized_prompt, original_tokens, optimized_tokens, token_reduction_pct, quality_maintained, model_used, category } = req.body;
    const result = await pool.query(
      `UPDATE prompt_optimization SET name = $1, original_prompt = $2, optimized_prompt = $3, original_tokens = $4, optimized_tokens = $5,
       token_reduction_pct = $6, quality_maintained = $7, model_used = $8, category = $9
       WHERE id = $10 RETURNING *`,
      [name, original_prompt, optimized_prompt, original_tokens, optimized_tokens, token_reduction_pct, quality_maintained, model_used, category, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prompt optimization not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update prompt optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/prompt-optimization/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM prompt_optimization WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Prompt optimization not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete prompt optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prompt-optimization/ai/optimize
router.post('/ai/optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM prompt_optimization ORDER BY token_reduction_pct DESC LIMIT 10');
    const systemPrompt = `You are a prompt engineering expert. Optimize prompts to reduce tokens while maintaining quality. Return JSON: { optimized_prompt, original_tokens, estimated_optimized_tokens, reduction_pct, quality_impact }`;
    const userContent = (prompt || 'Provide analysis based on the data.') + '\n\nData: ' + JSON.stringify(data.rows);
    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'prompt-optimization', { prompt, data: data.rows }, text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI optimize error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
