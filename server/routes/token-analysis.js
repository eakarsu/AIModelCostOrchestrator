const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/token-analysis
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM token_analysis ORDER BY analyzed_at DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get token analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/token-analysis/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM token_analysis WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get token analysis record error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/token-analysis
router.post('/', auth, async (req, res) => {
  try {
    const { application, endpoint, avg_input_tokens, avg_output_tokens, max_tokens_observed, waste_percentage, optimization_potential, period, analyzed_at } = req.body;
    const result = await pool.query(
      `INSERT INTO token_analysis (application, endpoint, avg_input_tokens, avg_output_tokens, max_tokens_observed, waste_percentage, optimization_potential, period, analyzed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [application, endpoint, avg_input_tokens, avg_output_tokens, max_tokens_observed, waste_percentage, optimization_potential, period || 'weekly', analyzed_at || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create token analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/token-analysis/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { application, endpoint, avg_input_tokens, avg_output_tokens, max_tokens_observed, waste_percentage, optimization_potential, period, analyzed_at } = req.body;
    const result = await pool.query(
      `UPDATE token_analysis SET application = $1, endpoint = $2, avg_input_tokens = $3, avg_output_tokens = $4, max_tokens_observed = $5,
       waste_percentage = $6, optimization_potential = $7, period = $8, analyzed_at = $9
       WHERE id = $10 RETURNING *`,
      [application, endpoint, avg_input_tokens, avg_output_tokens, max_tokens_observed, waste_percentage, optimization_potential, period, analyzed_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update token analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/token-analysis/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM token_analysis WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete token analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/token-analysis/ai/optimize
router.post('/ai/optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM token_analysis ORDER BY waste_percentage DESC LIMIT 10');
    const systemPrompt = `You are a token optimization expert. Analyze token waste and suggest improvements. Return JSON: { total_waste_pct, top_offenders: [{application, waste_pct}], optimization_actions: [] }`;
    const userContent = (prompt || 'Provide analysis based on the data.') + '\n\nData: ' + JSON.stringify(data.rows);
    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'token-analysis', { prompt, data: data.rows }, text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI optimize error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
