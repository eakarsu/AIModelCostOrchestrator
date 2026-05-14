import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, Sparkles, Brain } from 'lucide-react';
import AppLayout from '../components/AppLayout';

function authFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...(opts.headers || {}) } }).then(r => r.json());
}

const STATUS_CONFIG = {
  healthy: { color: '#10b981', icon: <CheckCircle size={14} /> },
  degraded: { color: '#f59e0b', icon: <AlertCircle size={14} /> },
  down: { color: '#ef4444', icon: <XCircle size={14} /> },
};

export default function UsageMonitoringPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const LIMIT = 15;

  useEffect(() => { fetchData(); }, [page]);

  async function fetchData() {
    setLoading(true);
    const res = await authFetch(`/api/usage-monitoring?page=${page}&limit=${LIMIT}`);
    if (res.success) { setRecords(res.data); setTotal(res.total || res.data.length); }
    setLoading(false);
  }

  async function handleAI() {
    setAiLoading(true);
    const res = await authFetch('/api/usage-monitoring/ai/anomalies', { method: 'POST', body: JSON.stringify({}) });
    if (res.success) setAiResult(res.data);
    setAiLoading(false);
  }

  const totalCost = records.reduce((s, r) => s + parseFloat(r.cost_today || 0), 0);
  const totalRequests = records.reduce((s, r) => s + parseInt(r.requests_today || 0), 0);
  const avgErrorRate = records.length > 0 ? (records.reduce((s, r) => s + parseFloat(r.error_rate || 0), 0) / records.length).toFixed(2) : 0;

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={26} style={{ color: '#06b6d4' }} /> Usage Monitoring
            </h1>
            <p>Per-service token, cost, and error rate monitoring</p>
          </div>
          <button className="btn" onClick={handleAI} disabled={aiLoading} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> {aiLoading ? 'Detecting...' : 'AI Anomaly Detection'}
          </button>
        </div>

        {/* KPIs */}
        <div className="stats-row" style={{ marginBottom: 24 }}>
          <div className="stat-card"><div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Today's Cost</div><div className="stat-card-value">${totalCost.toFixed(4)}</div></div>
          <div className="stat-card"><div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Total Requests</div><div className="stat-card-value">{totalRequests.toLocaleString()}</div></div>
          <div className="stat-card"><div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Avg Error Rate</div><div className="stat-card-value" style={{ color: parseFloat(avgErrorRate) > 5 ? '#ef4444' : 'inherit' }}>{avgErrorRate}%</div></div>
          <div className="stat-card"><div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Services</div><div className="stat-card-value">{records.length}</div></div>
        </div>

        {/* AI Anomalies */}
        {aiResult && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-accent)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={14} /> Anomaly Detection Results
            </div>
            {aiResult.overall_health && (
              <div style={{ marginBottom: 10, fontSize: 13 }}>
                <strong>System Health:</strong>{' '}
                <span style={{ color: { healthy: '#10b981', degraded: '#f59e0b', critical: '#ef4444' }[aiResult.overall_health] || '#64748b' }}>
                  {aiResult.overall_health?.toUpperCase()}
                </span>
              </div>
            )}
            {aiResult.anomalies?.length > 0 && (
              <div>
                <strong style={{ fontSize: 13 }}>Anomalies:</strong>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiResult.anomalies.map((a, i) => (
                    <div key={i} style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '8px 12px', fontSize: 13 }}>
                      <strong style={{ color: '#f87171' }}>{a.service}</strong>: {a.issue} — severity: <span style={{ color: '#f59e0b' }}>{a.severity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-secondary)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Services ({total})</span>
          </div>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Service', 'Model', 'Requests Today', 'Tokens Today', 'Cost Today', 'Error Rate', 'Avg Response', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.degraded;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.service_name}</td>
                        <td style={{ padding: '10px 14px', color: '#a78bfa', fontSize: 11, fontFamily: 'monospace' }}>{r.model_name}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{Number(r.requests_today || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{Number(r.tokens_today || 0).toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 600 }}>${Number(r.cost_today || 0).toFixed(4)}</td>
                        <td style={{ padding: '10px 14px', color: parseFloat(r.error_rate) > 5 ? '#ef4444' : 'var(--text-secondary)' }}>{r.error_rate ?? 0}%</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{r.avg_response_time ? `${r.avg_response_time}ms` : '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: sc.color, fontSize: 12, fontWeight: 600 }}>
                            {sc.icon} {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {records.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No monitoring data</td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {total > LIMIT && (
            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: 8, borderTop: '1px solid var(--border-secondary)' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }}>Prev</button>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }}>Next</button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
