const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/team-reports
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM team_reports ORDER BY report_date DESC, created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get team reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/team-reports/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM team_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Team report not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get team report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/team-reports
router.post('/', auth, async (req, res) => {
  try {
    const { team_name, department, total_requests, total_tokens, total_cost, avg_cost_per_request, top_model, efficiency_score, period, report_date } = req.body;
    const result = await pool.query(
      `INSERT INTO team_reports (team_name, department, total_requests, total_tokens, total_cost, avg_cost_per_request, top_model, efficiency_score, period, report_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [team_name, department, total_requests, total_tokens, total_cost, avg_cost_per_request, top_model, efficiency_score, period || 'monthly', report_date || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create team report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/team-reports/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { team_name, department, total_requests, total_tokens, total_cost, avg_cost_per_request, top_model, efficiency_score, period, report_date } = req.body;
    const result = await pool.query(
      `UPDATE team_reports SET team_name = $1, department = $2, total_requests = $3, total_tokens = $4, total_cost = $5,
       avg_cost_per_request = $6, top_model = $7, efficiency_score = $8, period = $9, report_date = $10
       WHERE id = $11 RETURNING *`,
      [team_name, department, total_requests, total_tokens, total_cost, avg_cost_per_request, top_model, efficiency_score, period, report_date, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Team report not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update team report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/team-reports/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM team_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Team report not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Delete team report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/team-reports/ai/analyze
router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const data = await pool.query('SELECT * FROM team_reports ORDER BY total_cost DESC LIMIT 10');

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
            content: 'You are an AI team usage analyst. Analyze team usage reports to identify spending patterns, efficiency differences between teams, and opportunities for cross-team optimization. Provide actionable recommendations for each team.'
          },
          {
            role: 'user',
            content: (prompt || 'Analyze team usage reports and identify optimization opportunities across teams.') + '\n\nTeam report data: ' + JSON.stringify(data.rows)
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
