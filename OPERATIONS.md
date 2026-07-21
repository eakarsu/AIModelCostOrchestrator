# Operator runbook

Run `npm ci` explicitly, review `server/migrations/001_cost_routing_workflow.sql`, and apply via `DATABASE_URL=... ./scripts/migrate.sh`. Startup does not create schema, seed, install, or terminate ports. Configure a strong JWT secret and keep experimental routes disabled.

No request dispatches without a current catalog/evaluation version, serialized budget reservation, quality floor, closed circuit, configured provider, and independent approval above threshold. Provider credentials and invoice data are external gates. During outage open the circuit, stop fallback when quality/cost constraints cannot be met, preserve telemetry, and reconcile reservations against provider invoices before releasing budget.
