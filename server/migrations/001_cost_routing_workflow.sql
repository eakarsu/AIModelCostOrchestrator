BEGIN;
CREATE TABLE IF NOT EXISTS routing_catalog_versions (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, catalog_version TEXT NOT NULL, model_ref TEXT NOT NULL,
 provider TEXT NOT NULL, capabilities JSONB NOT NULL, input_per_million NUMERIC(18,8) NOT NULL,
 output_per_million NUMERIC(18,8) NOT NULL, eval_score NUMERIC(8,6) NOT NULL, effective_from TIMESTAMPTZ NOT NULL,
 effective_to TIMESTAMPTZ, circuit_state TEXT NOT NULL DEFAULT 'closed', UNIQUE(tenant_id,catalog_version,model_ref)
);
CREATE TABLE IF NOT EXISTS tenant_budgets (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, budget_ref TEXT NOT NULL, period_start DATE NOT NULL, period_end DATE NOT NULL,
 limit_amount NUMERIC(18,6) NOT NULL, per_request_limit NUMERIC(18,6) NOT NULL, approval_threshold NUMERIC(18,6) NOT NULL,
 reserved_amount NUMERIC(18,6) NOT NULL DEFAULT 0, spent_amount NUMERIC(18,6) NOT NULL DEFAULT 0,
 version INTEGER NOT NULL DEFAULT 1, locked_at TIMESTAMPTZ, UNIQUE(tenant_id,budget_ref,period_start)
);
CREATE TABLE IF NOT EXISTS routing_requests (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, request_ref TEXT NOT NULL, idempotency_key TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'planned', catalog_version TEXT NOT NULL, evaluation_version TEXT NOT NULL,
 estimated_input_tokens INTEGER NOT NULL, estimated_output_tokens INTEGER NOT NULL, estimated_cost NUMERIC(18,6) NOT NULL,
 selected_model_ref TEXT, fallback_policy JSONB NOT NULL, budget_ref TEXT NOT NULL, created_by TEXT NOT NULL,
 approval_required BOOLEAN NOT NULL, approved_by TEXT, provider_receipt TEXT, failure_code TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(tenant_id,request_ref), UNIQUE(tenant_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS provider_run_telemetry (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, request_ref TEXT NOT NULL, provider TEXT NOT NULL, model_ref TEXT NOT NULL,
 attempt INTEGER NOT NULL, input_tokens INTEGER NOT NULL, output_tokens INTEGER NOT NULL, latency_ms INTEGER NOT NULL,
 provider_cost NUMERIC(18,6) NOT NULL, quality_score NUMERIC(8,6), structured_output_valid BOOLEAN NOT NULL,
 error_class TEXT, provider_request_id TEXT, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,request_ref,provider,attempt)
);
CREATE TABLE IF NOT EXISTS provider_invoice_reconciliation (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, request_ref TEXT NOT NULL, invoice_ref TEXT NOT NULL,
 invoice_cost NUMERIC(18,6) NOT NULL, provider_cost NUMERIC(18,6) NOT NULL, estimated_cost NUMERIC(18,6) NOT NULL,
 variance NUMERIC(18,6) NOT NULL, reconciled_by TEXT NOT NULL, reconciled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,invoice_ref,request_ref)
);
CREATE TABLE IF NOT EXISTS cost_workflow_audit (
 id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, request_ref TEXT NOT NULL, from_status TEXT, to_status TEXT NOT NULL,
 actor_id TEXT NOT NULL, actor_role TEXT NOT NULL, reason TEXT NOT NULL, evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
 correlation_id TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_routing_requests_budget ON routing_requests(tenant_id,budget_ref,status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cost_audit_correlation ON cost_workflow_audit(tenant_id,request_ref,correlation_id);
COMMIT;
