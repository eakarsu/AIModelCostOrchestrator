import React from 'react';

const controls = [
  ['Provider Credential Registry', 'OpenAI, Azure, Anthropic, Bedrock, self-hosted, and gateway credentials with owner and expiry.'],
  ['Billing Export Center', 'Customer, team, model, token, cache, and invoice evidence exports for finance reconciliation.'],
  ['Quota & Rate Policy', 'Tenant quotas, burst limits, fairness controls, abuse protection, and exception approvals.'],
  ['Telemetry Freshness Monitor', 'Token, latency, cache, error, and cost telemetry freshness by provider and route.'],
  ['Enterprise Identity & Access', 'SSO/MFA, role mapping, API key ownership, break-glass access, and certification.'],
  ['Release Test Harness', 'Seeded routing scenarios, cost regression checks, API smoke tests, and launch approvals.'],
];

export default function ProductionControlsPage() {
  return (
    <div className="dashboard-page">
      <h1>Production Controls</h1>
      <p>Missing production-readiness workflows for AI model cost orchestration.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20 }}>
        {controls.map(([title, detail]) => (
          <section className="card" key={title}>
            <h2 style={{ fontSize: 16 }}>{title}</h2>
            <p>{detail}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
