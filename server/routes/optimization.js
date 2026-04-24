const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/optimizations
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM optimizations ORDER BY priority ASC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get optimizations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/optimizations/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM optimizations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Optimization not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/optimizations
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, model_from, model_to, estimated_savings_pct, estimated_savings_monthly, priority, status, category } = req.body;
    const result = await pool.query(
      `INSERT INTO optimizations (title, description, model_from, model_to, estimated_savings_pct, estimated_savings_monthly, priority, status, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, model_from, model_to, estimated_savings_pct, estimated_savings_monthly, priority || 'medium', status || 'pending', category]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/optimizations/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, model_from, model_to, estimated_savings_pct, estimated_savings_monthly, priority, status, category } = req.body;
    const result = await pool.query(
      `UPDATE optimizations SET title = $1, description = $2, model_from = $3, model_to = $4, estimated_savings_pct = $5,
       estimated_savings_monthly = $6, priority = $7, status = $8, category = $9
       WHERE id = $10 RETURNING *`,
      [title, description, model_from, model_to, estimated_savings_pct, estimated_savings_monthly, priority, status, category, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Optimization not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/optimizations/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM optimizations WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Optimization not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/optimizations/ai/generate
router.post('/ai/generate', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM optimizations ORDER BY estimated_savings_monthly DESC LIMIT 10');

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
            content: 'You are an AI cost optimization strategist. Generate specific, actionable optimization recommendations for reducing AI infrastructure costs. Include model migration suggestions, usage pattern improvements, and architectural changes. Provide estimated savings percentages and monthly dollar amounts.'
          },
          {
            role: 'user',
            content: (prompt || 'Generate new cost optimization recommendations based on current optimizations and spending patterns.') + '\n\nCurrent optimizations: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI generate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
