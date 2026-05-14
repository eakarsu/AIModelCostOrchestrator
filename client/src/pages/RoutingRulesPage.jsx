import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Brain, Sparkles, CheckCircle, XCircle, Trash2, Edit3 } from 'lucide-react';
import AppLayout from '../components/AppLayout';

function authFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...(opts.headers || {}) } }).then(r => r.json());
}

const EMPTY_FORM = { name: '', description: '', condition_type: 'token_count', condition_value: '', target_model: '', fallback_model: '', priority: 1, is_active: true };

export default function RoutingRulesPage() {
  const [rules, setRules] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const LIMIT = 15;

  useEffect(() => { fetch_rules(); }, [page]);

  async function fetch_rules() {
    setLoading(true);
    const res = await authFetch(`/api/routing-rules?page=${page}&limit=${LIMIT}`);
    if (res.success) { setRules(res.data); setTotal(res.total || res.data.length); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editItem ? 'PUT' : 'POST';
    const url = editItem ? `/api/routing-rules/${editItem.id}` : '/api/routing-rules';
    await authFetch(url, { method, body: JSON.stringify({ ...form, is_active: form.is_active === true || form.is_active === 'true' }) });
    setShowForm(false); setEditItem(null); setForm(EMPTY_FORM); fetch_rules();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this rule?')) return;
    await authFetch(`/api/routing-rules/${id}`, { method: 'DELETE' });
    fetch_rules();
  }

  function openEdit(rule) {
    setEditItem(rule);
    setForm({ name: rule.name, description: rule.description || '', condition_type: rule.condition_type, condition_value: rule.condition_value, target_model: rule.target_model, fallback_model: rule.fallback_model || '', priority: rule.priority, is_active: rule.is_active });
    setShowForm(true);
  }

  async function handleAISuggest() {
    setAiLoading(true);
    const res = await authFetch('/api/routing-rules/ai/suggest', { method: 'POST', body: JSON.stringify({ prompt: 'Suggest optimal routing rules to minimize cost while maintaining quality' }) });
    if (res.success) setAiSuggestion(res.data);
    setAiLoading(false);
  }

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GitBranch size={26} style={{ color: '#ec4899' }} /> Routing Rules
            </h1>
            <p>Control which models handle which requests based on conditions</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn" onClick={handleAISuggest} disabled={aiLoading} style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> {aiLoading ? 'Thinking...' : 'AI Suggest'}
            </button>
            <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={14} /> New Rule
            </button>
          </div>
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-accent)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={14} /> AI Routing Suggestion
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              {aiSuggestion.recommended_model && <div><span style={{ color: 'var(--text-muted)' }}>Recommended:</span> <strong style={{ color: 'var(--text-primary)' }}>{aiSuggestion.recommended_model}</strong></div>}
              {aiSuggestion.alternative_model && <div><span style={{ color: 'var(--text-muted)' }}>Alternative:</span> <strong style={{ color: 'var(--text-primary)' }}>{aiSuggestion.alternative_model}</strong></div>}
              {aiSuggestion.cost_savings_estimate && <div><span style={{ color: 'var(--text-muted)' }}>Est. Savings:</span> <strong style={{ color: '#10b981' }}>{aiSuggestion.cost_savings_estimate}</strong></div>}
              {aiSuggestion.confidence && <div><span style={{ color: 'var(--text-muted)' }}>Confidence:</span> <strong style={{ color: '#f59e0b' }}>{aiSuggestion.confidence}</strong></div>}
            </div>
            {aiSuggestion.routing_criteria && <div style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 13 }}><strong>Criteria:</strong> {aiSuggestion.routing_criteria}</div>}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-secondary)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Rules ({total})</span>
          </div>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Rule Name', 'Condition', 'Target Model', 'Fallback', 'Priority', 'Cost Saved', 'Active', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-secondary)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rules.map(rule => (
                    <tr key={rule.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{rule.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{rule.condition_type}: <span style={{ color: '#f59e0b' }}>{rule.condition_value}</span></td>
                      <td style={{ padding: '10px 14px', color: '#a78bfa', fontFamily: 'monospace', fontSize: 11 }}>{rule.target_model}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>{rule.fallback_model || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{rule.priority}</td>
                      <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 600 }}>${Number(rule.cost_saved || 0).toFixed(4)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {rule.is_active ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(rule)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#a78bfa', cursor: 'pointer' }}><Edit3 size={12} /></button>
                          <button onClick={() => handleDelete(rule.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#f87171', cursor: 'pointer' }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No routing rules yet</td></tr>}
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

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <h2 style={{ marginBottom: 20 }}>{editItem ? 'Edit Rule' : 'New Routing Rule'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { key: 'name', label: 'Rule Name', required: true },
                    { key: 'priority', label: 'Priority', type: 'number' },
                    { key: 'condition_value', label: 'Condition Value', required: true },
                    { key: 'target_model', label: 'Target Model', required: true },
                    { key: 'fallback_model', label: 'Fallback Model' },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label>{f.label}{f.required ? ' *' : ''}</label>
                      <input className="form-input" type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label>Condition Type</label>
                    <select className="form-input" value={form.condition_type} onChange={e => setForm({ ...form, condition_type: e.target.value })}>
                      {['token_count', 'task_type', 'priority', 'cost_limit', 'latency_requirement'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Description</label>
                    <textarea className="form-input" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} id="is_active" />
                    <label htmlFor="is_active" style={{ marginBottom: 0 }}>Active</label>
                  </div>
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
