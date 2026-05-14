const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const DEFAULT_MODEL = 'anthropic/claude-3-5-sonnet-20241022';
const HAIKU_MODEL = 'anthropic/claude-haiku-4';

// POST /api/proxy/chat - LLM proxy with routing rules and cost tracking
router.post('/chat', auth, async (req, res) => {
  try {
    const { messages, user_id, department, max_tokens } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array is required' });
    }

    // Fetch active routing rules
    const rulesResult = await pool.query(
      'SELECT * FROM routing_rules WHERE is_active = true ORDER BY priority ASC'
    );
    const rules = rulesResult.rows;

    // Determine message length for routing
    const totalLength = messages.map(m => m.content || '').join(' ').length;

    // Apply routing rules
    let selectedModel = DEFAULT_MODEL;
    let appliedRule = null;

    for (const rule of rules) {
      if (rule.condition_type === 'token_count' && totalLength < parseInt(rule.condition_value)) {
        selectedModel = rule.target_model || HAIKU_MODEL;
        appliedRule = rule;
        break;
      } else if (rule.condition_type === 'task_type' && department && rule.condition_value === department) {
        selectedModel = rule.target_model || DEFAULT_MODEL;
        appliedRule = rule;
        break;
      }
    }

    // Simple length-based fallback: short messages use haiku
    if (!appliedRule) {
      if (totalLength < 500) {
        selectedModel = HAIKU_MODEL;
      }
    }

    const startTime = Date.now();

    // Call OpenRouter
    const orResponse = await fetch(process.env.OPENROUTER_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
        'X-Title': 'AI Cost Orchestrator',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        max_tokens: max_tokens || 1000,
        temperature: 0.7,
      }),
    });

    const orData = await orResponse.json();
    if (orData.error) {
      return res.status(502).json({ success: false, error: orData.error.message });
    }

    const latencyMs = Date.now() - startTime;
    const usage = orData.usage || {};
    const totalTokens = usage.total_tokens || 0;
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;

    // Look up cost per token from ai_models table
    const modelRecord = await pool.query(
      'SELECT cost_per_1k_input, cost_per_1k_output FROM ai_models WHERE model_id = $1 LIMIT 1',
      [selectedModel]
    );

    let actualCost = 0;
    let defaultCost = 0;
    if (modelRecord.rows.length > 0) {
      const { cost_per_1k_input, cost_per_1k_output } = modelRecord.rows[0];
      actualCost = (inputTokens / 1000) * parseFloat(cost_per_1k_input) + (outputTokens / 1000) * parseFloat(cost_per_1k_output);
    }

    // Estimate cost of default model for savings calc
    const defaultModelRecord = await pool.query(
      'SELECT cost_per_1k_input, cost_per_1k_output FROM ai_models WHERE model_id = $1 LIMIT 1',
      [DEFAULT_MODEL]
    );
    if (defaultModelRecord.rows.length > 0) {
      const { cost_per_1k_input, cost_per_1k_output } = defaultModelRecord.rows[0];
      defaultCost = (inputTokens / 1000) * parseFloat(cost_per_1k_input) + (outputTokens / 1000) * parseFloat(cost_per_1k_output);
    }

    const savingsVsDefault = Math.max(0, defaultCost - actualCost);

    // Record to cost_analytics
    const today = new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO cost_analytics (model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
       ON CONFLICT DO NOTHING`,
      [selectedModel, department || 'proxy', today, totalTokens, inputTokens, outputTokens, actualCost, latencyMs]
    ).catch(() => {
      // Insert without ON CONFLICT if table doesn't support it
      pool.query(
        `INSERT INTO cost_analytics (model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)`,
        [selectedModel, department || 'proxy', today, totalTokens, inputTokens, outputTokens, actualCost, latencyMs]
      ).catch(() => {});
    });

    // Check budget alerts
    if (department) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const spendResult = await pool.query(
        `SELECT COALESCE(SUM(total_cost), 0) as spent FROM cost_analytics WHERE department = $1 AND date >= $2`,
        [department, monthStart.toISOString()]
      );
      const spent = parseFloat(spendResult.rows[0].spent);
      const alertResult = await pool.query(
        'SELECT * FROM budget_alerts WHERE department = $1 AND status = $2 LIMIT 1',
        [department, 'active']
      );
      if (alertResult.rows.length > 0) {
        const alert = alertResult.rows[0];
        if (spent > parseFloat(alert.budget_limit)) {
          await pool.query(
            'UPDATE budget_alerts SET notified_at = NOW(), status = $1 WHERE id = $2',
            ['triggered', alert.id]
          );
        }
      }
    }

    // Update routing rule stats
    if (appliedRule) {
      await pool.query(
        'UPDATE routing_rules SET requests_routed = requests_routed + 1, cost_saved = cost_saved + $1 WHERE id = $2',
        [savingsVsDefault, appliedRule.id]
      ).catch(() => {});
    }

    res.json({
      success: true,
      content: orData.choices?.[0]?.message?.content || '',
      model_used: selectedModel,
      cost: parseFloat(actualCost.toFixed(6)),
      savings_vs_default: parseFloat(savingsVsDefault.toFixed(6)),
      tokens_used: totalTokens,
      latency_ms: latencyMs,
    });
  } catch (error) {
    console.error('Proxy chat error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
