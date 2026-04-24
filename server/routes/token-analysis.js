const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

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
router.post('/ai/optimize', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM token_analysis ORDER BY waste_percentage DESC LIMIT 10');

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
            content: 'You are an AI token optimization expert. Analyze token usage patterns and suggest ways to reduce token waste. Focus on prompt engineering techniques, context window optimization, and output length management to minimize costs while maintaining quality.'
          },
          {
            role: 'user',
            content: (prompt || 'Analyze token usage and suggest optimizations to reduce waste and costs.') + '\n\nToken analysis data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI optimize error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
