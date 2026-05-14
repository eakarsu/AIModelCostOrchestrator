import React, { useState, useEffect } from 'react';
import { History, Brain } from 'lucide-react';
import AppLayout from '../components/AppLayout';

function authFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...(opts.headers || {}) } }).then(r => r.json());
}

const FEATURES = ['all', 'cost-analytics', 'routing-rules', 'budget-alerts', 'usage-monitoring', 'ab-testing', 'models', 'optimizations', 'benchmarks', 'token-analysis', 'cost-forecasting', 'api-keys', 'team-reports', 'prompt-optimization', 'cache-management', 'rate-limiting', 'cost-allocation'];

export default function AIResultsPage() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [feature, setFeature] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const LIMIT = 20;

  useEffect(() => { fetchResults(); }, [page, feature]);

  async function fetchResults() {
    setLoading(true);
    const featureParam = feature !== 'all' ? `&feature=${feature}` : '';
    const res = await authFetch(`/api/ai-results?page=${page}&limit=${LIMIT}${featureParam}`);
    if (res.success) { setResults(res.data); setTotal(res.total || 0); }
    setLoading(false);
  }

  function parseResult(r) {
    try { return JSON.parse(r); } catch { return r; }
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <History size={26} style={{ color: '#a78bfa' }} /> AI Results History
            </h1>
            <p>Browse all AI insights generated across features</p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {FEATURES.map(f => (
            <button
              key={f}
              onClick={() => { setFeature(f); setPage(1); }}
              style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
                background: feature === f ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                color: feature === f ? '#a78bfa' : 'var(--text-muted)',
                fontWeight: feature === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((r) => {
              const parsed = parseResult(r.result);
              const isExpanded = expanded === r.id;
              return (
                <div key={r.id} style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border-secondary)', overflow: 'hidden' }}>
                  <div
                    style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>{r.feature}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isExpanded ? 'Collapse' : 'Expand'}</div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-secondary)' }}>
                      <div style={{ marginTop: 12 }}>
                        {typeof parsed === 'object' ? (
                          <pre style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 16, fontSize: 12, color: 'var(--text-secondary)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {JSON.stringify(parsed, null, 2)}
                          </pre>
                        ) : (
                          <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 16, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {parsed}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {results.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Brain size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>No AI results yet. Run AI analysis from any feature page.</div>
              </div>
            )}
          </div>
        )}

        {total > LIMIT && (
          <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }}>Prev</button>
            <span style={{ color: 'var(--text-muted)', fontSize: 13, alignSelf: 'center' }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)} className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13 }}>Next</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
