const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/ab-testing
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ab_testing ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get ab tests error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ab-testing/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ab_testing WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'A/B test not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get ab test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ab-testing
router.post('/', auth, async (req, res) => {
  try {
    const { test_name, model_a, model_b, metric, model_a_score, model_b_score, model_a_cost, model_b_cost, sample_size, winner, status, started_at, ended_at } = req.body;
    const result = await pool.query(
      `INSERT INTO ab_testing (test_name, model_a, model_b, metric, model_a_score, model_b_score, model_a_cost, model_b_cost, sample_size, winner, status, started_at, ended_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [test_name, model_a, model_b, metric, model_a_score, model_b_score, model_a_cost, model_b_cost, sample_size || 0, winner, status || 'running', started_at || new Date(), ended_at]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create ab test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/ab-testing/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { test_name, model_a, model_b, metric, model_a_score, model_b_score, model_a_cost, model_b_cost, sample_size, winner, status, started_at, ended_at } = req.body;
    const result = await pool.query(
      `UPDATE ab_testing SET test_name = $1, model_a = $2, model_b = $3, metric = $4, model_a_score = $5, model_b_score = $6,
       model_a_cost = $7, model_b_cost = $8, sample_size = $9, winner = $10, status = $11, started_at = $12, ended_at = $13
       WHERE id = $14 RETURNING *`,
      [test_name, model_a, model_b, metric, model_a_score, model_b_score, model_a_cost, model_b_cost, sample_size, winner, status, started_at, ended_at, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'A/B test not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update ab test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/ab-testing/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ab_testing WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'A/B test not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete ab test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ab-testing/ai/recommend
router.post('/ai/recommend', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM ab_testing ORDER BY created_at DESC LIMIT 10');

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
            content: 'You are an AI A/B testing expert. Analyze model comparison test results and recommend winners based on cost-effectiveness, quality scores, and statistical significance. Consider sample sizes and confidence intervals in your recommendations.'
          },
          {
            role: 'user',
            content: (prompt || 'Analyze these A/B test results and recommend winners for each test.') + '\n\nA/B test data: ' + JSON.stringify(data.rows)
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
