import React, { useState, useEffect } from 'react';
import { FlaskConical, Plus, Brain, Sparkles, Trash2, Edit3 } from 'lucide-react';
import AppLayout from '../components/AppLayout';

function authFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...(opts.headers || {}) } }).then(r => r.json());
}

const EMPTY_FORM = { test_name: '', model_a: '', model_b: '', metric: 'quality', model_a_score: '', model_b_score: '', model_a_cost: '', model_b_cost: '', sample_size: '', winner: 'pending', status: 'draft' };

const STATUS_COLORS = { running: '#10b981', completed: '#6366f1', draft: '#64748b', cancelled: '#ef4444' };
const WINNER_COLORS = { model_a: '#6366f1', model_b: '#8b5cf6', inconclusive: '#f59e0b', pending: '#64748b' };

export default function ABTestingPage() {
  const [tests, setTests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiRec, setAiRec] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const LIMIT = 15;

  useEffect(() => { fetchTests(); }, [page]);

  async function fetchTests() {
    setLoading(true);
    const res = await authFetch(`/api/ab-testing?page=${page}&limit=${LIMIT}`);
    if (res.success) { setTests(res.data); setTotal(res.total || res.data.length); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editItem ? 'PUT' : 'POST';
    const url = editItem ? `/api/ab-testing/${editItem.id}` : '/api/ab-testing';
    await authFetch(url, { method, body: JSON.stringify(form) });
    setShowForm(false); setEditItem(null); setForm(EMPTY_FORM); fetchTests();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this test?')) return;
    await authFetch(`/api/ab-testing/${id}`, { method: 'DELETE' });
    fetchTests();
  }

  function openEdit(t) {
    setEditItem(t);
    setForm({ test_name: t.test_name, model_a: t.model_a, model_b: t.model_b, metric: t.metric, model_a_score: t.model_a_score || '', model_b_score: t.model_b_score || '', model_a_cost: t.model_a_cost || '', model_b_cost: t.model_b_cost || '', sample_size: t.sample_size || '', winner: t.winner || 'pending', status: t.status });
    setShowForm(true);
  }

  async function handleAIRecommend() {
    setAiLoading(true);
    const res = await authFetch('/api/ab-testing/ai/recommend', { method: 'POST', body: JSON.stringify({ prompt: 'Analyze all A/B tests and recommend the best performing models' }) });
    if (res.success) setAiRec(res.data);
    setAiLoading(false);
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FlaskConical size={26} style={{ color: '#f97316' }} /> A/B Testing
            </h1>
            <p>Compare model performance and cost in controlled experiments</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={handleAIRecommend} disabled={aiLoading} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> {aiLoading ? 'Analyzing...' : 'AI Recommend'}
            </button>
            <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> New Test
            </button>
          </div>
        </div>

        {aiRec && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-accent)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={14} /> AI Recommendation
            </div>
            {aiRec.recommended_model && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}><strong>Winner:</strong> {aiRec.recommended_model} ({aiRec.confidence_pct}% confidence)</div>}
            {aiRec.key_findings?.length > 0 && <ul style={{ paddingLeft: 16, margin: 0 }}>{aiRec.key_findings.map((f, i) => <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>{f}</li>)}</ul>}
          </div>
        )}

        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-secondary)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Tests ({total})</span>
          </div>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Test Name', 'Model A', 'Model B', 'Score A', 'Score B', 'Cost A', 'Cost B', 'Winner', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tests.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{t.test_name}</td>
                      <td style={{ padding: '10px 14px', color: '#a78bfa', fontSize: 11, fontFamily: 'monospace' }}>{t.model_a}</td>
                      <td style={{ padding: '10px 14px', color: '#c084fc', fontSize: 11, fontFamily: 'monospace' }}>{t.model_b}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{t.model_a_score ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{t.model_b_score ?? '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#10b981' }}>{t.model_a_cost ? `$${t.model_a_cost}` : '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#10b981' }}>{t.model_b_cost ? `$${t.model_b_cost}` : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${WINNER_COLORS[t.winner] || '#64748b'}22`, color: WINNER_COLORS[t.winner] || '#64748b' }}>{t.winner || '—'}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${STATUS_COLORS[t.status] || '#64748b'}22`, color: STATUS_COLORS[t.status] || '#64748b' }}>{t.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(t)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#a78bfa', cursor: 'pointer' }}><Edit3 size={12} /></button>
                          <button onClick={() => handleDelete(t.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#f87171', cursor: 'pointer' }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tests.length === 0 && <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No A/B tests yet</td></tr>}
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

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <h2 style={{ marginBottom: 20 }}>{editItem ? 'Edit Test' : 'New A/B Test'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { key: 'test_name', label: 'Test Name', required: true },
                    { key: 'metric', label: 'Primary Metric' },
                    { key: 'model_a', label: 'Model A', required: true },
                    { key: 'model_b', label: 'Model B', required: true },
                    { key: 'model_a_score', label: 'Model A Score', type: 'number' },
                    { key: 'model_b_score', label: 'Model B Score', type: 'number' },
                    { key: 'model_a_cost', label: 'Model A Cost ($)', type: 'number' },
                    { key: 'model_b_cost', label: 'Model B Cost ($)', type: 'number' },
                    { key: 'sample_size', label: 'Sample Size', type: 'number' },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label>{f.label}{f.required ? ' *' : ''}</label>
                      <input className="form-input" type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                    </div>
                  ))}
                  {[
                    { key: 'winner', label: 'Winner', options: ['pending', 'model_a', 'model_b', 'inconclusive'] },
                    { key: 'status', label: 'Status', options: ['draft', 'running', 'completed', 'cancelled'], required: true },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label>{f.label}</label>
                      <select className="form-input" value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
