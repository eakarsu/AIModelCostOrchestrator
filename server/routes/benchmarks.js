const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/benchmarks
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM benchmarks ORDER BY test_date DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get benchmarks error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/benchmarks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM benchmarks WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Benchmark not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get benchmark error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/benchmarks
router.post('/', auth, async (req, res) => {
  try {
    const { model_name, task_type, accuracy_score, speed_ms, cost_per_request, throughput_rps, quality_rating, test_date } = req.body;
    const result = await pool.query(
      `INSERT INTO benchmarks (model_name, task_type, accuracy_score, speed_ms, cost_per_request, throughput_rps, quality_rating, test_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [model_name, task_type, accuracy_score, speed_ms, cost_per_request, throughput_rps, quality_rating, test_date || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create benchmark error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/benchmarks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { model_name, task_type, accuracy_score, speed_ms, cost_per_request, throughput_rps, quality_rating, test_date } = req.body;
    const result = await pool.query(
      `UPDATE benchmarks SET model_name = $1, task_type = $2, accuracy_score = $3, speed_ms = $4, cost_per_request = $5,
       throughput_rps = $6, quality_rating = $7, test_date = $8
       WHERE id = $9 RETURNING *`,
      [model_name, task_type, accuracy_score, speed_ms, cost_per_request, throughput_rps, quality_rating, test_date, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Benchmark not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update benchmark error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/benchmarks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM benchmarks WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Benchmark not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete benchmark error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/benchmarks/ai/compare
router.post('/ai/compare', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM benchmarks ORDER BY test_date DESC LIMIT 10');

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
            content: 'You are an AI model benchmarking expert. Compare model performance benchmarks across accuracy, speed, cost, and throughput dimensions. Identify the best models for different use cases and provide cost-performance trade-off analysis.'
          },
          {
            role: 'user',
            content: (prompt || 'Compare these benchmark results and identify the best models for different use cases.') + '\n\nBenchmark data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI compare error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
