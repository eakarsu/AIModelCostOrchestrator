const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/ai-results - paginated history of AI results
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const feature = req.query.feature;
    const offset = (page - 1) * limit;

    const whereClause = feature ? 'WHERE feature = $3' : '';
    const params = feature ? [limit, offset, feature] : [limit, offset];

    const result = await pool.query(
      `SELECT id, user_id, feature, result, created_at FROM ai_results ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM ai_results ${feature ? 'WHERE feature = $1' : ''}`,
      feature ? [feature] : []
    );

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    });
  } catch (error) {
    console.error('Get AI results error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
