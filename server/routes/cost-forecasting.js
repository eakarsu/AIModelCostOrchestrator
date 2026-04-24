const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

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
router.post('/ai/predict', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM cost_forecasting ORDER BY projected_cost DESC LIMIT 10');

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
            content: 'You are an AI cost forecasting expert. Predict future AI infrastructure costs based on current usage trends, growth rates, and market factors. Provide forecasts for different scenarios (optimistic, baseline, pessimistic) with confidence levels.'
          },
          {
            role: 'user',
            content: (prompt || 'Predict future AI costs based on current data and provide scenario-based forecasts.') + '\n\nForecast data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI predict error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
