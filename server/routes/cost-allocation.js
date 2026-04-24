const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/cost-allocation
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_allocation ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get cost allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cost-allocation/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_allocation WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cost allocation not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get cost allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cost-allocation
router.post('/', auth, async (req, res) => {
  try {
    const { tag_name, project, department, environment, allocated_budget, actual_spend, variance_pct, models_used, owner, status, period } = req.body;
    const result = await pool.query(
      `INSERT INTO cost_allocation (tag_name, project, department, environment, allocated_budget, actual_spend, variance_pct, models_used, owner, status, period)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [tag_name, project, department, environment || 'production', allocated_budget, actual_spend || 0, variance_pct || 0, models_used, owner, status || 'active', period || 'monthly']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create cost allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/cost-allocation/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { tag_name, project, department, environment, allocated_budget, actual_spend, variance_pct, models_used, owner, status, period } = req.body;
    const result = await pool.query(
      `UPDATE cost_allocation SET tag_name = $1, project = $2, department = $3, environment = $4, allocated_budget = $5,
       actual_spend = $6, variance_pct = $7, models_used = $8, owner = $9, status = $10, period = $11
       WHERE id = $12 RETURNING *`,
      [tag_name, project, department, environment, allocated_budget, actual_spend, variance_pct, models_used, owner, status, period, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cost allocation not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update cost allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/cost-allocation/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cost_allocation WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cost allocation not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete cost allocation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cost-allocation/ai/optimize
router.post('/ai/optimize', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cost_allocation ORDER BY actual_spend DESC LIMIT 10');

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
            content: 'You are an AI cost allocation expert. Analyze cost allocation tags and spending patterns across projects, departments, and environments. Identify budget variances, recommend reallocation strategies, and suggest ways to improve cost visibility and accountability.'
          },
          {
            role: 'user',
            content: (prompt || 'Optimize cost allocation across projects and departments based on current spending data.') + '\n\nCost allocation data: ' + JSON.stringify(data.rows)
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
