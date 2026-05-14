import React, { useState, useEffect } from 'react';
import { Bell, Plus, AlertTriangle, CheckCircle, TrendingUp, Trash2, Edit3 } from 'lucide-react';
import AppLayout from '../components/AppLayout';

function authFetch(url, opts = {}) {
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...(opts.headers || {}) } }).then(r => r.json());
}

const EMPTY_FORM = { name: '', department: '', budget_limit: '', alert_threshold_pct: 80, alert_type: 'email', status: 'active', period: 'monthly' };

export default function BudgetAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [checkResults, setCheckResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [alertsRes, checkRes] = await Promise.all([
      authFetch('/api/budget-alerts'),
      authFetch('/api/budget-alerts/check'),
    ]);
    if (alertsRes.success) setAlerts(alertsRes.data);
    if (checkRes.success) setCheckResults(checkRes.alerts || []);
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const method = editItem ? 'PUT' : 'POST';
    const url = editItem ? `/api/budget-alerts/${editItem.id}` : '/api/budget-alerts';
    await authFetch(url, { method, body: JSON.stringify(form) });
    setShowForm(false); setEditItem(null); setForm(EMPTY_FORM); fetchData();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this alert?')) return;
    await authFetch(`/api/budget-alerts/${id}`, { method: 'DELETE' });
    fetchData();
  }

  function openEdit(a) {
    setEditItem(a);
    setForm({ name: a.name, department: a.department, budget_limit: a.budget_limit, alert_threshold_pct: a.alert_threshold_pct, alert_type: a.alert_type, status: a.status, period: a.period });
    setShowForm(true);
  }

  const statusColor = (s) => ({ over: '#ef4444', warning: '#f59e0b', under: '#10b981' }[s] || '#64748b');
  const statusIcon = (s) => s === 'under' ? <CheckCircle size={18} color="#10b981" /> : <AlertTriangle size={18} color={statusColor(s)} />;

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={26} style={{ color: '#ef4444' }} /> Budget Alerts
            </h1>
            <p>Monitor department spending vs thresholds in real-time</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> New Alert
          </button>
        </div>

        {/* Live Status Cards */}
        {checkResults.length > 0 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>Live Budget Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 28 }}>
              {checkResults.map((r, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 18, border: `1px solid ${r.status === 'over' ? 'rgba(239,68,68,0.3)' : r.status === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.2)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{r.department}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                    </div>
                    {statusIcon(r.status)}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Spent: <strong style={{ color: statusColor(r.status) }}>${r.spent}</strong></span>
                      <span>Limit: ${r.threshold}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, r.pct_used)}%`, background: statusColor(r.status), borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{r.pct_used}% used</div>
                  </div>
                  {r.over_by > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#f87171' }}>
                      Over by ${r.over_by}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-secondary)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Alert Configurations ({alerts.length})</span>
          </div>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Name', 'Department', 'Budget Limit', 'Threshold %', 'Period', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{a.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{a.department}</td>
                      <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 600 }}>${Number(a.budget_limit || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{a.alert_threshold_pct}%</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{a.period}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: a.status === 'triggered' ? 'rgba(239,68,68,0.15)' : a.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: a.status === 'triggered' ? '#f87171' : a.status === 'active' ? '#34d399' : '#94a3b8' }}>
                          {a.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(a)} style={{ background: 'rgba(99,102,241,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#a78bfa', cursor: 'pointer' }}><Edit3 size={12} /></button>
                          <button onClick={() => handleDelete(a.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#f87171', cursor: 'pointer' }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {alerts.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No alerts configured</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <h2 style={{ marginBottom: 20 }}>{editItem ? 'Edit Alert' : 'New Budget Alert'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { key: 'name', label: 'Alert Name', required: true },
                    { key: 'department', label: 'Department', required: true },
                    { key: 'budget_limit', label: 'Budget Limit ($)', type: 'number', required: true },
                    { key: 'alert_threshold_pct', label: 'Warning Threshold (%)', type: 'number' },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label>{f.label}{f.required ? ' *' : ''}</label>
                      <input className="form-input" type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required={f.required} />
                    </div>
                  ))}
                  {[
                    { key: 'alert_type', label: 'Alert Type', options: ['email', 'slack', 'webhook', 'sms'] },
                    { key: 'status', label: 'Status', options: ['active', 'triggered', 'resolved', 'disabled'] },
                    { key: 'period', label: 'Period', options: ['daily', 'weekly', 'monthly', 'quarterly'] },
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
