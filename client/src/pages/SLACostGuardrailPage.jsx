import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function SLACostGuardrailPage() {
  const [result, setResult] = useState(null);

  const evaluate = async () => {
    const res = await fetch(`${API}/sla-cost-guardrail/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestsPerMinute: 420, avgTokens: 1800, modelCostPer1k: 0.006, latencyP95Ms: 2600, monthlyBudget: 5500, slaMs: 2000 }),
    });
    setResult(await res.json());
  };

  return (
    <div className="dashboard-page">
      <h1>SLA Cost Guardrail</h1>
      <p>Evaluate model routing against spend ceiling and latency SLA before traffic is admitted.</p>
      <button onClick={evaluate}>Evaluate guardrail</button>
      {result && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2>{result.band}</h2>
          <p>Projected monthly cost: ${result.projectedMonthlyCost}</p>
          <pre>{JSON.stringify(result.actions, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
