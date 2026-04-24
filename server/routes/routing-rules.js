const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/routing-rules
router.get('/', auth, async (req, res) => {
  try {
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
router.post('/ai/suggest', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM routing_rules ORDER BY cost_saved DESC LIMIT 10');

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
            content: 'You are an AI model routing expert. Suggest intelligent routing rules that direct requests to the most cost-effective model based on task complexity, latency requirements, and quality needs. Consider fallback strategies and load balancing.'
          },
          {
            role: 'user',
            content: (prompt || 'Suggest new routing rules to optimize model selection and reduce costs.') + '\n\nCurrent routing rules: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI suggest error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
