import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { BarChart3, Brain, Sparkles, TrendingUp, DollarSign, Zap } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { getAll, aiAction } from '../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

export default function CostAnalyticsPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ byModel: [], byDepartment: [], daily: [] });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  useEffect(() => {
    fetchData();
  }, [page]);

  async function fetchData() {
    setLoading(true);
    try {
      const [summaryRes, recordsRes] = await Promise.all([
        fetch('/api/cost-analytics/summary', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
        fetch(`/api/cost-analytics?page=${page}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
      ]);
      if (summaryRes.success) setSummary(summaryRes.data);
      if (recordsRes.success) {
        setRecords(recordsRes.data);
        setTotal(recordsRes.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAIInsights() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/cost-analytics/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ prompt: 'Analyze spending patterns and identify top optimization opportunities' }),
      }).then(r => r.json());
      if (res.success) setAiResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  const totalSpend = summary.byModel.reduce((s, m) => s + parseFloat(m.total_cost || 0), 0);

  return (
    <AppLayout>
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart3 size={28} style={{ color: '#8b5cf6' }} />
              Cost Analytics
            </h1>
            <p>Spend breakdown by model, department, and time</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleAIInsights}
            disabled={aiLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Sparkles size={15} />
            {aiLoading ? 'Analyzing...' : 'AI Insights'}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="stats-row" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Total Spend</div>
            <div className="stat-card-value">${totalSpend.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Models Used</div>
            <div className="stat-card-value">{summary.byModel.length}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Departments</div>
            <div className="stat-card-value">{summary.byDepartment.length}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>Days Tracked</div>
            <div className="stat-card-value">{summary.daily.length}</div>
          </div>
        </div>

        {/* AI Result */}
        {aiResult && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-accent)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Brain size={14} /> AI Insights
            </div>
            {aiResult.raw ? (
              <pre style={{ color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'pre-wrap' }}>{aiResult.raw}</pre>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {aiResult.total_spend !== undefined && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    <strong>Total Spend:</strong> ${typeof aiResult.total_spend === 'number' ? aiResult.total_spend.toFixed(2) : aiResult.total_spend}
                  </div>
                )}
                {aiResult.top_cost_driver && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    <strong>Top Cost Driver:</strong> {aiResult.top_cost_driver}
                  </div>
                )}
                {aiResult.budget_status && (
                  <div style={{ fontSize: 13 }}>
                    <strong>Budget Status:</strong>{' '}
                    <span style={{ color: aiResult.budget_status === 'over' ? '#ef4444' : aiResult.budget_status === 'under' ? '#10b981' : '#f59e0b' }}>
                      {aiResult.budget_status.toUpperCase()}
                    </span>
                  </div>
                )}
                {aiResult.optimization_opportunities?.length > 0 && (
                  <div>
                    <strong style={{ fontSize: 13 }}>Optimization Opportunities:</strong>
                    <ul style={{ marginTop: 6, paddingLeft: 16 }}>
                      {aiResult.optimization_opportunities.map((op, i) => (
                        <li key={i} style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>
                          {op.action} — <span style={{ color: '#10b981' }}>~{op.estimated_savings_pct}% savings</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Spend by Model */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, border: '1px solid var(--border-secondary)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Spend by Model</h3>
            {summary.byModel.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={summary.byModel} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="model_name" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Cost']} contentStyle={{ background: '#1a1d2e', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="total_cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>
            )}
          </div>

          {/* Daily spend trend */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, border: '1px solid var(--border-secondary)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Daily Spend Trend (30 days)</h3>
            {summary.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={summary.daily.map(d => ({ ...d, date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Cost']} contentStyle={{ background: '#1a1d2e', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="total_cost" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data yet</div>
            )}
          </div>
        </div>

        {/* Department pie */}
        {summary.byDepartment.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, border: '1px solid var(--border-secondary)', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Spend by Department</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie data={summary.byDepartment} dataKey="total_cost" nameKey="department" cx="50%" cy="50%" outerRadius={90} label={false}>
                    {summary.byDepartment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${Number(v).toFixed(4)}`} contentStyle={{ background: '#1a1d2e', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {summary.byDepartment.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{d.department}</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>${Number(d.total_cost).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Records table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-secondary)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Records ({total})</h3>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Model', 'Department', 'Date', 'Tokens Used', 'Total Cost', 'Requests'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border-secondary)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>{r.model_name}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.department}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{Number(r.tokens_used || 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', color: '#10b981', fontWeight: 600 }}>${Number(r.total_cost || 0).toFixed(4)}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.request_count || '-'}</td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No records</td></tr>
                  )}
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
