const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

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
router.post('/ai/optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cost_allocation ORDER BY actual_spend DESC LIMIT 10');
    const systemPrompt = `You are a cost allocation expert. Optimize AI cost allocation across projects and teams. Return JSON: { reallocation_suggestions: [{from, to, amount, reason}], budget_variances: [{project, variance_pct}] }`;
    const userContent = (prompt || 'Provide analysis based on the data.') + '\n\nData: ' + JSON.stringify(data.rows);
    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'cost-allocation', { prompt, data: data.rows }, text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI optimize error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
