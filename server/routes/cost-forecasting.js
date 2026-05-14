const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// GET /api/cost-forecasting
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_forecasting ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get cost forecasting error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/cost-forecasting/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_forecasting WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Forecast not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get forecast error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cost-forecasting
router.post('/', auth, async (req, res) => {
  try {
    const { model_name, forecast_period, current_monthly_cost, projected_cost, growth_rate_pct, confidence_level, factors, scenario } = req.body;
    const result = await pool.query(
      `INSERT INTO cost_forecasting (model_name, forecast_period, current_monthly_cost, projected_cost, growth_rate_pct, confidence_level, factors, scenario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [model_name, forecast_period, current_monthly_cost, projected_cost, growth_rate_pct, confidence_level, factors, scenario || 'baseline']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create forecast error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/cost-forecasting/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { model_name, forecast_period, current_monthly_cost, projected_cost, growth_rate_pct, confidence_level, factors, scenario } = req.body;
    const result = await pool.query(
      `UPDATE cost_forecasting SET model_name = $1, forecast_period = $2, current_monthly_cost = $3, projected_cost = $4, growth_rate_pct = $5,
       confidence_level = $6, factors = $7, scenario = $8
       WHERE id = $9 RETURNING *`,
      [model_name, forecast_period, current_monthly_cost, projected_cost, growth_rate_pct, confidence_level, factors, scenario, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Forecast not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update forecast error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/cost-forecasting/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cost_forecasting WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Forecast not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete forecast error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cost-forecasting/ai/predict
router.post('/ai/predict', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cost_forecasting ORDER BY projected_cost DESC LIMIT 10');
    const systemPrompt = `You are a cost forecasting expert. Predict future AI costs. Return JSON: { 30_day_forecast, 90_day_forecast, growth_rate_pct, risk_factors: [], mitigation_strategies: [] }`;
    const userContent = (prompt || 'Provide analysis based on the data.') + '\n\nData: ' + JSON.stringify(data.rows);
    const text = await callOpenRouter(systemPrompt, userContent, 1000);
    const parsed = parseAIJson(text);
    await saveAIResult(req.user?.id, 'cost-forecasting', { prompt, data: data.rows }, text);
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('AI predict error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
