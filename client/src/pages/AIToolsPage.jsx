import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  Sparkles, AlertOctagon, Brain, Wand2, PieChart,
  CreditCard, Plug, Bell, Cpu, Activity, BugOff, TrendingUp,
} from 'lucide-react';

const TOOLS = [
  {
    key: 'cost-anomaly-detection',
    label: 'Cost Anomaly Detection',
    icon: AlertOctagon,
    endpoint: '/api/ai/cost-anomaly-detection',
    description: 'Identify cost spike anomalies in recent usage records.',
    fields: [
      { key: 'lookbackDays', label: 'Lookback Days', type: 'number', placeholder: '14' },
      { key: 'threshold', label: 'Threshold (multiplier)', type: 'number', placeholder: '2' },
    ],
  },
  {
    key: 'model-recommendation',
    label: 'Model Recommendation',
    icon: Brain,
    endpoint: '/api/ai/model-recommendation',
    description: 'Recommend primary + fallback model from the catalog given task description and targets.',
    fields: [
      { key: 'taskDescription', label: 'Task Description', type: 'textarea', required: true, placeholder: 'What is the task?' },
      { key: 'latencyTarget', label: 'Latency Target', type: 'text', placeholder: 'e.g. <1s p95' },
      { key: 'qualityTarget', label: 'Quality Target', type: 'text', placeholder: 'e.g. high' },
      { key: 'budget', label: 'Budget (USD/month)', type: 'number' },
    ],
  },
  {
    key: 'prompt-optimization-suggestion',
    label: 'Prompt Optimization',
    icon: Wand2,
    endpoint: '/api/ai/prompt-optimization-suggestion',
    description: 'Rewrite a prompt to reduce tokens while preserving intent.',
    fields: [
      { key: 'prompt', label: 'Prompt', type: 'textarea', required: true, placeholder: 'Paste prompt to optimize' },
      { key: 'goal', label: 'Optimization Goal', type: 'text', placeholder: 'e.g. minimize tokens, preserve intent' },
    ],
  },
  {
    key: 'budget-allocation',
    label: 'Budget Allocation',
    icon: PieChart,
    endpoint: '/api/ai/budget-allocation',
    description: 'Allocate spend across teams/projects from cost-allocation history.',
    fields: [
      { key: 'totalBudget', label: 'Total Budget (USD)', type: 'number', required: true, placeholder: '10000' },
      { key: 'period', label: 'Period', type: 'text', placeholder: 'monthly' },
      { key: 'constraints', label: 'Constraints', type: 'textarea', placeholder: 'e.g., reserve 10% for R&D' },
      { key: 'priorities', label: 'Priorities', type: 'textarea', placeholder: 'e.g., favor revenue-tied teams' },
    ],
  },
  // ---------- Apply pass 5 — additive backlog tools ----------
  {
    key: 'billing-stripe',
    label: 'Stripe Billing Plan (NEEDS-CREDS)',
    icon: CreditCard,
    endpoint: '/api/ai/billing-stripe',
    description: 'Build a usage-based invoice plan. Requires STRIPE_API_KEY.',
    fields: [
      { key: 'customerId', label: 'Customer ID (optional)', type: 'text' },
      { key: 'period', label: 'Period', type: 'text', placeholder: 'monthly' },
    ],
  },
  {
    key: 'provider-openai-arbitrage',
    label: 'OpenAI Cost Arbitrage (NEEDS-CREDS)',
    icon: Plug,
    endpoint: '/api/ai/provider-openai-arbitrage',
    description: 'Compare OpenAI direct vs OpenRouter. Requires OPENAI_API_KEY.',
    fields: [
      { key: 'task', label: 'Task', type: 'textarea' },
      { key: 'currentModel', label: 'Current Model', type: 'text' },
    ],
  },
  {
    key: 'provider-anthropic-arbitrage',
    label: 'Anthropic Cost Arbitrage (NEEDS-CREDS)',
    icon: Plug,
    endpoint: '/api/ai/provider-anthropic-arbitrage',
    description: 'Compare Anthropic direct vs OpenRouter. Requires ANTHROPIC_API_KEY.',
    fields: [
      { key: 'task', label: 'Task', type: 'textarea' },
      { key: 'currentModel', label: 'Current Model', type: 'text' },
    ],
  },
  {
    key: 'provider-aws-bedrock-arbitrage',
    label: 'AWS Bedrock Arbitrage (NEEDS-CREDS)',
    icon: Plug,
    endpoint: '/api/ai/provider-aws-bedrock-arbitrage',
    description: 'Suggest the best Bedrock model. Requires AWS_BEDROCK_REGION.',
    fields: [
      { key: 'task', label: 'Task', type: 'textarea' },
    ],
  },
  {
    key: 'webhook-alert-config',
    label: 'Alert Webhook (NEEDS-CREDS)',
    icon: Bell,
    endpoint: '/api/ai/webhook-alert-config',
    description: 'Register a cost-threshold alert webhook. Requires ALERT_WEBHOOK_URL or webhook_url.',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text' },
      { key: 'threshold', label: 'Threshold (USD)', type: 'number', placeholder: '100' },
    ],
  },
  {
    key: 'custom-model-register',
    label: 'Register Custom Model',
    icon: Cpu,
    endpoint: '/api/ai/custom-model-register',
    description: 'Register a fine-tuned / custom model with its costs.',
    fields: [
      { key: 'provider', label: 'Provider', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'cost_per_1k_input', label: 'Cost / 1k input tokens (USD)', type: 'number' },
      { key: 'cost_per_1k_output', label: 'Cost / 1k output tokens (USD)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    key: 'latency-record',
    label: 'Record Latency Sample',
    icon: Activity,
    endpoint: '/api/ai/latency-record',
    description: 'Append a latency sample (ms) for a model. Stats served at /latency-stats.',
    fields: [
      { key: 'model', label: 'Model', type: 'text', required: true },
      { key: 'latency_ms', label: 'Latency (ms)', type: 'number', required: true },
    ],
  },
  {
    key: 'error-record',
    label: 'Record Error Event',
    icon: BugOff,
    endpoint: '/api/ai/error-record',
    description: 'Record an error event (rate_limit, server_error, client_error, timeout).',
    fields: [
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'kind', label: 'Kind', type: 'text', placeholder: 'server_error' },
      { key: 'message', label: 'Message', type: 'textarea' },
    ],
  },
];

async function postJson(url, payload) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

export default function AIToolsPage() {
  const [activeKey, setActiveKey] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const tool = TOOLS.find(t => t.key === activeKey);

  const setField = (key, value) =>
    setInputs(prev => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {};
      tool.fields.forEach(f => {
        const v = inputs[f.key];
        if (v === undefined || v === '') return;
        payload[f.key] = f.type === 'number' ? Number(v) : v;
      });
      const data = await postJson(tool.endpoint, payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container" style={{ padding: 24 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Sparkles size={22} /> AI Tools
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: 20 }}>
          Cost anomaly detection, model recommendation, and prompt optimization.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
          {TOOLS.map(t => {
            const Icon = t.icon;
            const active = t.key === activeKey;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { setActiveKey(t.key); setInputs({}); setResult(null); setError(null); }}
                style={{
                  textAlign: 'left',
                  padding: 16,
                  border: active ? '2px solid #6366f1' : '1px solid #334155',
                  background: active ? 'rgba(99,102,241,0.1)' : '#1e293b',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: '#e2e8f0',
                }}
              >
                <Icon size={20} color={active ? '#6366f1' : '#94a3b8'} />
                <div style={{ fontWeight: 600, marginTop: 8 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{t.description}</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 24, maxWidth: 760 }}>
          <h2 style={{ marginBottom: 4 }}>{tool.label}</h2>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>{tool.description}</p>

          <form onSubmit={submit}>
            {tool.fields.map(field => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {field.label}{field.required ? ' *' : ''}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={4}
                    required={field.required}
                    value={inputs[field.key] || ''}
                    onChange={e => setField(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{ width: '100%', padding: 8, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6 }}
                  />
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    value={inputs[field.key] || ''}
                    onChange={e => setField(field.key, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{ width: '100%', padding: 8, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6 }}
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: 12,
                fontSize: 14,
                background: loading ? '#475569' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8,
              }}
            >
              {loading ? 'Running…' : `Run ${tool.label}`}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fecaca', borderRadius: 6 }}>
              {String(error)}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 20, padding: 16, background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}>
              <h3 style={{ marginBottom: 8 }}>Result</h3>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#e2e8f0' }}>
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
