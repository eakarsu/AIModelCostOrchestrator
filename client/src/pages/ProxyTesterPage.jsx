import React, { useState } from 'react';
import { Zap, Send, Brain, DollarSign, TrendingDown, Clock } from 'lucide-react';
import AppLayout from '../components/AppLayout';

function authFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...(opts.headers || {}) } }).then(r => r.json());
}

export default function ProxyTesterPage() {
  const [message, setMessage] = useState('');
  const [department, setDepartment] = useState('');
  const [maxTokens, setMaxTokens] = useState(500);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  async function handleSend() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/proxy/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          department: department || undefined,
          max_tokens: parseInt(maxTokens) || 500,
        }),
      });
      setResult(res);
      if (res.success) {
        setHistory(h => [{ message, ...res, ts: new Date().toLocaleTimeString() }, ...h.slice(0, 9)]);
      }
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={26} style={{ color: '#f59e0b' }} /> LLM Proxy Tester
            </h1>
            <p>Test the intelligent routing proxy — see which model gets selected and actual cost</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Main tester */}
          <div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)', padding: 20, marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Your Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Type a message to test the LLM proxy..."
                rows={6}
                className="form-input"
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Department (optional)</label>
                  <input className="form-input" placeholder="e.g. engineering" value={department} onChange={e => setDepartment(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Max Tokens</label>
                  <input className="form-input" type="number" value={maxTokens} onChange={e => setMaxTokens(e.target.value)} />
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !message.trim()}
                className="btn btn-primary"
                style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}
              >
                <Send size={14} /> {loading ? 'Sending...' : 'Send via Proxy'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                Short messages (&lt;500 chars) auto-route to Haiku. Longer ones use Sonnet.
              </div>
            </div>

            {/* Result */}
            {result && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: `1px solid ${result.success ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.3)'}`, padding: 20 }}>
                {result.success ? (
                  <>
                    {/* Metadata row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Model Used</div>
                        <div style={{ color: '#a78bfa', fontFamily: 'monospace', fontWeight: 600 }}>{result.model_used}</div>
                      </div>
                      <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Cost</div>
                        <div style={{ color: '#34d399', fontWeight: 600 }}>${result.cost}</div>
                      </div>
                      <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Savings vs Default</div>
                        <div style={{ color: '#fbbf24', fontWeight: 600 }}>${result.savings_vs_default}</div>
                      </div>
                      <div style={{ background: 'rgba(6,182,212,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Tokens</div>
                        <div style={{ color: '#22d3ee', fontWeight: 600 }}>{result.tokens_used}</div>
                      </div>
                      <div style={{ background: 'rgba(139,92,246,0.1)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Latency</div>
                        <div style={{ color: '#a78bfa', fontWeight: 600 }}>{result.latency_ms}ms</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Response:</div>
                    <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 16, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {result.content}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#f87171', fontSize: 14 }}>Error: {result.error}</div>
                )}
              </div>
            )}
          </div>

          {/* History panel */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)', padding: 16, alignSelf: 'start' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Recent Requests
            </div>
            {history.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No requests yet</div>
            ) : (
              history.map((h, i) => (
                <div key={i} style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border-secondary)' : 'none', paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{h.ts}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.message}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(139,92,246,0.15)', color: '#c084fc', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                      {h.model_used?.split('/').pop()}
                    </span>
                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                      ${h.cost}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
