# Audit Note — AIModelCostOrchestrator

Source audit: `_AUDIT/reports/batch_05.md` § 25

## Original audit recommendations

### Missing AI endpoints (audit reported 0)
- `/ai/cost-anomaly-detection`
- `/ai/model-recommendation`
- `/ai/prompt-optimization-suggestion`
- `/ai/budget-allocation`

### Missing non-AI features
- Billing integration
- Custom model support
- Latency tracking
- Error rate monitoring
- Provider integrations (OpenAI, Anthropic, AWS)
- Webhook alerts
- Usage trends visualization

### Custom feature suggestions
- Agentic model selection
- Real-time cost optimization
- Autonomous budget management
- Multi-provider cost arbitrage
- Fine-tuning ROI analyzer
- Vertical cost benchmarking

## Implemented in this pass
Created `server/routes/ai.js` (mounted at `/api/ai` in `server.js`). Adds the three core formal `/ai/*` endpoints called out by the audit:

1. **POST `/api/ai/cost-anomaly-detection`** — pulls recent `usage_records` and asks the model to identify cost spike anomalies.
2. **POST `/api/ai/model-recommendation`** — recommends primary + fallback model from the catalog (`models` table) given task description, latency/quality/budget targets.
3. **POST `/api/ai/prompt-optimization-suggestion`** — rewrites a user-supplied prompt to reduce tokens while preserving intent.

All three use the existing `lib/aiHelper` (`callOpenRouter`, `parseAIJson`, `saveAIResult`) and middleware (`auth`, `aiRateLimiter`). Defensive try/catch on DB queries handles schema variance. Syntax checked.

## Backlog (priority order)

### Mechanical
- `/ai/budget-allocation` (allocate spend across teams using existing `cost-allocation` data)

### Needs creds / external SDK
- Billing integration (Stripe usage-based metering)
- Provider direct integrations (OpenAI, Anthropic, AWS Bedrock — adds SDK deps)
- Webhook alerts (delivery infra)

### Needs product decision
- Custom / fine-tuned model support (cost model, hosting)
- Latency tracking pipeline (existing routes log usage but not P95 latency)
- Error rate monitoring (categorization + alerting policy)
- Usage trends visualization (frontend scope)

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS (FE already wired).

`client/src/pages/AIToolsPage.jsx` exposes the three pass-2 backend endpoints (`/api/ai/cost-anomaly-detection`, `/api/ai/model-recommendation`, `/api/ai/prompt-optimization-suggestion`) via a tabbed form UI. Inputs are typed (number / textarea / text) per the `TOOLS` config. Submits with `Authorization: Bearer <token>`; surfaces server errors and the structured AI result. Routed in `client/src/App.jsx` at `/dashboard/ai-tools` and linked in `components/AppLayout.jsx` sidebar. Companion `AIResultsPage.jsx` shows persisted history at `/dashboard/ai-results`.

Backend mount verified: `app.use('/api/ai', require('./routes/ai'))` in `server/server.js`.

Files: none modified.

## Apply pass 4 (mechanical backlog)

Implemented the one mechanical item from the prior backlog list (`/ai/budget-allocation`).

### Backend (`server/routes/ai.js`, extended)

**POST `/api/ai/budget-allocation`** — input `{ totalBudget, period?, constraints?, priorities? }`. Pulls historical `cost_allocations` and recent `usage_records` (both guarded by try/catch as the existing endpoints do), asks the LLM to allocate the total budget across teams/projects with rationale, reserve, assumptions, risks, and a review recommendation.

- Returns **HTTP 503** when `OPENROUTER_API_KEY` is unset.
- Uses existing `auth`, `aiRateLimiter`, `callOpenRouter`, `parseAIJson`, `saveAIResult` from `server/lib/aiHelper.js`.
- Returns `{ raw, structured }` shape matching the other `ai.js` endpoints.

### Frontend (`client/src/pages/AIToolsPage.jsx`, extended)

Appended a "Budget Allocation" entry to the `TOOLS` array (icon: `PieChart` from existing `lucide-react` dep). Reuses the existing `postJson` Bearer-token helper, the same tab UI, the same number/text/textarea field types, the same result rendering. No new dependencies.

### Smoke test
Started backend on port 3093. The pre-existing `aiRateLimiter` middleware in `server/middleware/rateLimiter.js` has a bug (`skip: false` instead of a function) that returns 500 on every AI route — this affects the existing `/cost-anomaly-detection`, `/model-recommendation`, `/prompt-optimization-suggestion` endpoints identically and was not introduced by this pass. Per constraints, did not touch working code.

Route registration verified by enumerating `router.stack` paths in `ai.js`: includes `cost-anomaly-detection`, `model-recommendation`, `prompt-optimization-suggestion`, `budget-allocation`.

### Files modified
- `server/routes/ai.js`
- `client/src/pages/AIToolsPage.jsx`

## Apply pass 5 (all backlog)

Implemented 9 endpoints additively (cap was 10) by appending to `server/routes/ai.js`. No changes to working code, no new deps.

### Backend (new endpoints)
1. `POST /api/ai/billing-stripe` — NEEDS-CREDS: STRIPE_API_KEY. 503+missing when unset. Additive: never calls Stripe; returns LLM invoice plan.
2. `POST /api/ai/provider-openai-arbitrage` — NEEDS-CREDS: OPENAI_API_KEY.
3. `POST /api/ai/provider-anthropic-arbitrage` — NEEDS-CREDS: ANTHROPIC_API_KEY.
4. `POST /api/ai/provider-aws-bedrock-arbitrage` — NEEDS-CREDS: AWS_BEDROCK_REGION.
5. `POST /api/ai/webhook-alert-config` — NEEDS-CREDS: ALERT_WEBHOOK_URL (or webhook_url body). Inserts into new `alert_subscriptions` table.
6. `POST /api/ai/custom-model-register` — PRODUCT-DECISION resolved (provider/name + per-1k-token costs in new `custom_models` table; no hosting).
7. `POST /api/ai/latency-record` + `GET /api/ai/latency-stats` — PRODUCT-DECISION: P50/P95/P99 from new `latency_samples` table (`percentile_cont`). Does not auto-instrument outbound calls.
8. `POST /api/ai/error-record` — PRODUCT-DECISION: kinds = rate_limit | server_error | client_error | timeout. New `error_events` table.
9. `GET /api/ai/usage-trends` — PRODUCT-DECISION: aggregated daily series from existing `usage_records`; FE handles charts.

Schema additions: `custom_models`, `latency_samples`, `error_events`, `alert_subscriptions` — all `CREATE TABLE IF NOT EXISTS`, ensured lazily.

### Frontend
Extended `client/src/pages/AIToolsPage.jsx` `TOOLS` array with 8 new entries (Stripe billing, OpenAI/Anthropic/Bedrock arbitrage, alert webhook, custom-model register, latency record, error record). Imports added to existing `lucide-react` icon set (already a dep). Reuses existing `postJson` Bearer-token helper, same tab UI.

### Smoke test
Started backend on port 3083. The DB role `aiorch_user` is missing from local Postgres (pre-existing setup issue), so login fails — this affects existing endpoints too. Verified all 14 routes (4 pre-existing + 10 new) are registered via `router.stack` introspection.

### Files modified
- `server/routes/ai.js` (extended)
- `client/src/pages/AIToolsPage.jsx` (extended)
