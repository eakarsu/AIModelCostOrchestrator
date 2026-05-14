const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, saveAIResult } = require('../lib/aiHelper');

// POST /api/ai/cost-anomaly-detection — flag unusual spending
router.post('/cost-anomaly-detection', auth, aiRateLimiter, async (req, res) => {
  try {
    const { lookbackDays = 14 } = req.body;
    let usage = [];
    try {
      const r = await pool.query(`SELECT * FROM usage_records WHERE created_at >= NOW() - INTERVAL '${parseInt(lookbackDays)} days' ORDER BY created_at DESC LIMIT 500`);
      usage = r.rows;
    } catch (e) { /* table optional */ }

    const systemPrompt = 'You are an AI cost anomaly detector for LLM API spending. Flag unusual cost spikes, model misroutes, and prompt-pattern anomalies. Always return valid JSON.';
    const userPrompt = `Detect cost anomalies in recent LLM usage.

Lookback: ${lookbackDays} days
Records (sample): ${JSON.stringify(usage).slice(0, 6000)}

JSON: { "anomalies": [{ "type": string, "severity": "low"|"medium"|"high", "evidence": string, "suspected_root_cause": string, "recommended_action": string }], "overall_risk_level": string, "watch_list": [string] }`;

    const raw = await callOpenRouter(systemPrompt, userPrompt, 1500);
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'cost-anomaly-detection', { lookbackDays, sampleCount: usage.length }, structured || raw);
    res.json({ raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/model-recommendation — suggest best model for a task
router.post('/model-recommendation', auth, aiRateLimiter, async (req, res) => {
  try {
    const { taskDescription, latencyTarget, qualityTarget, budgetPerCall, allowedProviders } = req.body;
    if (!taskDescription) return res.status(400).json({ error: 'taskDescription is required' });

    let models = [];
    try {
      const r = await pool.query('SELECT * FROM models LIMIT 100');
      models = r.rows;
    } catch (e) {}

    const systemPrompt = 'You are an AI model selection advisor. Recommend the best model for a task balancing latency, quality, and cost. Always return valid JSON.';
    const userPrompt = `Recommend the best model.

Task: ${taskDescription}
Latency target: ${latencyTarget || 'unspecified'}
Quality target: ${qualityTarget || 'unspecified'}
Budget per call: ${budgetPerCall ?? 'unspecified'}
Allowed providers: ${(allowedProviders || []).join(', ') || 'any'}

Available models in catalog: ${JSON.stringify(models).slice(0, 4000)}

JSON: { "primary": { "model": string, "provider": string, "rationale": string, "expected_cost_per_call": number, "expected_latency_ms": number }, "fallback": { "model": string, "provider": string }, "tradeoffs": string }`;

    const raw = await callOpenRouter(systemPrompt, userPrompt, 1200);
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'model-recommendation', { taskDescription }, structured || raw);
    res.json({ raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/prompt-optimization-suggestion — auto-improve a prompt
router.post('/prompt-optimization-suggestion', auth, aiRateLimiter, async (req, res) => {
  try {
    const { prompt, model, goals } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const systemPrompt = 'You are a prompt engineer. Rewrite prompts to reduce tokens and improve clarity while preserving intent. Always return valid JSON.';
    const userPrompt = `Improve this prompt for the target model.

Original prompt:
"""${prompt}"""

Target model: ${model || 'any'}
Goals: ${goals || 'reduce tokens, preserve intent, improve clarity'}

JSON: { "rewritten_prompt": string, "estimated_token_savings_percent": number, "rationale": string, "preserved_intent": boolean, "warnings": [string] }`;

    const raw = await callOpenRouter(systemPrompt, userPrompt, 1200);
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'prompt-optimization-suggestion', { promptLength: prompt.length, model }, structured || raw);
    res.json({ raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/budget-allocation — allocate spend across teams using cost-allocation data
router.post('/budget-allocation', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
    }
    const { totalBudget, period = 'monthly', constraints, priorities } = req.body;
    if (totalBudget === undefined || totalBudget === null) {
      return res.status(400).json({ error: 'totalBudget is required' });
    }

    let allocations = [];
    try {
      const r = await pool.query('SELECT * FROM cost_allocations LIMIT 200');
      allocations = r.rows;
    } catch (e) { /* table optional */ }

    let usage = [];
    try {
      const r = await pool.query("SELECT * FROM usage_records WHERE created_at >= NOW() - INTERVAL '30 days' ORDER BY created_at DESC LIMIT 500");
      usage = r.rows;
    } catch (e) {}

    const systemPrompt = 'You are an AI budget allocation advisor for LLM API spend. Distribute a total budget across teams/projects using historical cost-allocation patterns and recent usage. Always return valid JSON.';
    const userPrompt = `Allocate the total budget across teams/projects.

Total budget: ${totalBudget}
Period: ${period}
Constraints: ${constraints || 'none'}
Priorities: ${priorities || 'balance fairness, ROI, and recent demand'}

Historical cost allocations (sample): ${JSON.stringify(allocations).slice(0, 4000)}
Recent usage (sample): ${JSON.stringify(usage).slice(0, 4000)}

JSON: { "allocations": [{ "team_or_project": string, "amount": number, "percent_of_total": number, "rationale": string }], "reserve": number, "assumptions": [string], "risks": [string], "review_recommendation": string }`;

    const raw = await callOpenRouter(systemPrompt, userPrompt, 1500);
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'budget-allocation', { totalBudget, period }, structured || raw);
    res.json({ raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
// Apply pass 5 — additive backlog endpoints.
//
// Required env vars (documented):
//   OPENROUTER_API_KEY — required by every AI endpoint here.
//   STRIPE_API_KEY — for /billing-stripe (NEEDS-CREDS).
//   OPENAI_API_KEY — for /provider-openai-arbitrage (NEEDS-CREDS).
//   ANTHROPIC_API_KEY — for /provider-anthropic-arbitrage (NEEDS-CREDS).
//   AWS_BEDROCK_REGION — for /provider-aws-bedrock-arbitrage (NEEDS-CREDS).
//   ALERT_WEBHOOK_URL — for /webhook-alert-config (NEEDS-CREDS).
//
// Schema additions (CREATE TABLE IF NOT EXISTS, additive, never destructive):
//   custom_models, latency_samples, error_events, alert_subscriptions.
//
// PRODUCT-DECISION (defaults documented inline):
//   - Custom-model storage: provider/name + cost-per-1k-tokens (no hosting).
//   - Latency tracking pipeline: P95 derived from `latency_samples` rows.
//     We do not auto-instrument outbound calls in this pass.
//   - Error rate monitoring: simple categorisation by `kind`
//     (rate_limit | server_error | client_error | timeout).
//   - Usage trends viz: server returns aggregated daily series; FE handles
//     chart rendering (existing chart libs in client).
// =============================================================================

let _backlogTablesEnsured = false;
async function ensureBacklogTables() {
  if (_backlogTablesEnsured) return;
  const stmts = [
    `CREATE TABLE IF NOT EXISTS custom_models (
       id SERIAL PRIMARY KEY,
       provider TEXT NOT NULL,
       name TEXT NOT NULL,
       cost_per_1k_input NUMERIC(12,6) DEFAULT 0,
       cost_per_1k_output NUMERIC(12,6) DEFAULT 0,
       notes TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS latency_samples (
       id SERIAL PRIMARY KEY,
       model TEXT NOT NULL,
       latency_ms INTEGER NOT NULL,
       observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS error_events (
       id SERIAL PRIMARY KEY,
       model TEXT,
       kind TEXT NOT NULL,
       message TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS alert_subscriptions (
       id SERIAL PRIMARY KEY,
       user_id INTEGER,
       webhook_url TEXT NOT NULL,
       threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
       active BOOLEAN NOT NULL DEFAULT TRUE,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
  ];
  for (const s of stmts) { try { await pool.query(s); } catch (_) {} }
  _backlogTablesEnsured = true;
}

function requireKey(res, env) {
  if (!process.env[env]) {
    res.status(503).json({ error: `${env} not configured`, missing: env });
    return false;
  }
  return true;
}

// POST /api/ai/billing-stripe — NEEDS-CREDS: STRIPE_API_KEY.
// Additive: never makes a real Stripe call; produces an LLM-driven plan.
router.post('/billing-stripe', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res, 'OPENROUTER_API_KEY')) return;
    if (!requireKey(res, 'STRIPE_API_KEY')) return;
    const { customerId, period = 'monthly' } = req.body || {};
    let usage = [];
    try {
      const r = await pool.query(
        `SELECT model, COUNT(*) as calls, SUM(total_cost) as cost
         FROM usage_records
         WHERE created_at >= NOW() - INTERVAL '30 days'
         ${customerId ? 'AND customer_id = $1' : ''}
         GROUP BY model ORDER BY cost DESC LIMIT 50`,
        customerId ? [customerId] : []
      );
      usage = r.rows;
    } catch (_) {}
    const systemPrompt = 'You are a Stripe usage-based billing planner. Always return JSON.';
    const userPrompt = `Build an itemised invoice plan for the period.
CUSTOMER: ${customerId || 'all'} | PERIOD: ${period}
USAGE: ${JSON.stringify(usage).slice(0, 4000)}
JSON: { "lineItems": [{ "model": "...", "qty": 0, "unitPriceUsd": 0, "subtotalUsd": 0 }], "totalUsd": 0, "stripeMeteredEvents": [{ "eventName": "...", "value": 0 }] }`;
    const raw = await callOpenRouter(systemPrompt, userPrompt, 1200);
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'billing-stripe', { customerId, period }, structured || raw);
    res.json({ simulated: true, raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/provider-openai-arbitrage — NEEDS-CREDS: OPENAI_API_KEY (additive only).
router.post('/provider-openai-arbitrage', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res, 'OPENROUTER_API_KEY')) return;
    if (!requireKey(res, 'OPENAI_API_KEY')) return;
    const { task, currentModel } = req.body || {};
    const systemPrompt = 'You are a multi-provider cost-arbitrage advisor. JSON only.';
    const userPrompt = `Compare OpenAI direct vs OpenRouter for the task. Recommend.
TASK: ${task || 'unspecified'} | CURRENT_MODEL: ${currentModel || 'unspecified'}
JSON: { "recommendation": "...", "estimatedSavingsPct": 0, "rationale": "...", "fallback": "..." }`;
    const raw = await callOpenRouter(systemPrompt, userPrompt, 700);
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'provider-openai-arbitrage', { task, currentModel }, structured || raw);
    res.json({ simulated: true, raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/provider-anthropic-arbitrage — NEEDS-CREDS: ANTHROPIC_API_KEY.
router.post('/provider-anthropic-arbitrage', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res, 'OPENROUTER_API_KEY')) return;
    if (!requireKey(res, 'ANTHROPIC_API_KEY')) return;
    const { task, currentModel } = req.body || {};
    const raw = await callOpenRouter(
      'You are a multi-provider cost-arbitrage advisor. JSON only.',
      `Compare Anthropic direct vs OpenRouter for: ${task || 'general'} (current: ${currentModel || 'n/a'}).
JSON: { "recommendation": "...", "estimatedSavingsPct": 0, "rationale": "..." }`,
      700
    );
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'provider-anthropic-arbitrage', { task, currentModel }, structured || raw);
    res.json({ simulated: true, raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/provider-aws-bedrock-arbitrage — NEEDS-CREDS: AWS_BEDROCK_REGION.
router.post('/provider-aws-bedrock-arbitrage', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res, 'OPENROUTER_API_KEY')) return;
    if (!requireKey(res, 'AWS_BEDROCK_REGION')) return;
    const { task } = req.body || {};
    const raw = await callOpenRouter(
      'You are an AWS Bedrock cost-arbitrage advisor. JSON only.',
      `Suggest the best Bedrock model for: ${task || 'unspecified'} in region ${process.env.AWS_BEDROCK_REGION}.
JSON: { "model": "...", "rationale": "...", "estimatedCostPer1kTokens": 0 }`,
      700
    );
    const structured = parseAIJson(raw);
    saveAIResult(req.user?.id, 'provider-aws-bedrock-arbitrage', { task }, structured || raw);
    res.json({ simulated: true, raw, structured });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/webhook-alert-config — register an alert webhook (NEEDS-CREDS: ALERT_WEBHOOK_URL).
router.post('/webhook-alert-config', auth, aiRateLimiter, async (req, res) => {
  try {
    if (!requireKey(res, 'OPENROUTER_API_KEY')) return;
    await ensureBacklogTables();
    const webhook_url = (req.body && req.body.webhook_url) || process.env.ALERT_WEBHOOK_URL;
    if (!webhook_url) {
      return res.status(503).json({ error: 'Alert webhook not configured', missing: 'ALERT_WEBHOOK_URL' });
    }
    const { threshold = 0 } = req.body || {};
    const r = await pool.query(
      `INSERT INTO alert_subscriptions (user_id, webhook_url, threshold)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user?.id || null, webhook_url, threshold]
    );
    res.json({ subscription: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/custom-model-register — PRODUCT-DECISION: provider/name + costs.
router.post('/custom-model-register', auth, aiRateLimiter, async (req, res) => {
  try {
    await ensureBacklogTables();
    const { provider, name, cost_per_1k_input = 0, cost_per_1k_output = 0, notes } = req.body || {};
    if (!provider || !name) return res.status(400).json({ error: 'provider and name required' });
    const r = await pool.query(
      `INSERT INTO custom_models (provider, name, cost_per_1k_input, cost_per_1k_output, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [provider, name, cost_per_1k_input, cost_per_1k_output, notes || null]
    );
    res.json({ model: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/latency-record — record a latency sample (P95 lives in /latency-stats).
router.post('/latency-record', auth, aiRateLimiter, async (req, res) => {
  try {
    await ensureBacklogTables();
    const { model, latency_ms } = req.body || {};
    if (!model || latency_ms === undefined) return res.status(400).json({ error: 'model and latency_ms required' });
    const r = await pool.query(
      `INSERT INTO latency_samples (model, latency_ms) VALUES ($1, $2) RETURNING *`,
      [model, parseInt(latency_ms, 10) || 0]
    );
    res.json({ sample: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ai/latency-stats?model=... — P50/P95/P99 from samples.
router.get('/latency-stats', auth, async (req, res) => {
  try {
    await ensureBacklogTables();
    const { model } = req.query;
    const r = await pool.query(
      `SELECT model,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
              percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
              percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99,
              COUNT(*) AS n
       FROM latency_samples
       WHERE observed_at >= NOW() - INTERVAL '7 days'
       ${model ? 'AND model = $1' : ''}
       GROUP BY model
       ORDER BY n DESC`,
      model ? [model] : []
    );
    res.json({ stats: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/error-record — record an error event for monitoring.
router.post('/error-record', auth, aiRateLimiter, async (req, res) => {
  try {
    await ensureBacklogTables();
    const { model = null, kind, message } = req.body || {};
    const validKinds = ['rate_limit', 'server_error', 'client_error', 'timeout'];
    const k = validKinds.includes(kind) ? kind : 'server_error';
    const r = await pool.query(
      `INSERT INTO error_events (model, kind, message) VALUES ($1, $2, $3) RETURNING *`,
      [model, k, message || null]
    );
    res.json({ event: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ai/usage-trends?days=30 — aggregated daily usage for charting.
router.get('/usage-trends', auth, async (req, res) => {
  try {
    const days = Math.min(180, parseInt(req.query.days, 10) || 30);
    let trends = [];
    try {
      const r = await pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS calls,
                COALESCE(SUM(total_cost),0) AS cost
         FROM usage_records
         WHERE created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY 1 ORDER BY 1`
      );
      trends = r.rows;
    } catch (_) {}
    res.json({ days, trends });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
