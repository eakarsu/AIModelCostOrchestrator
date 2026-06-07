import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Brain, BarChart3, TrendingDown, Award, Activity, Bell, GitBranch,
  Hash, LineChart, FlaskConical, Key, Users, Wand2, Database, Gauge,
  PieChart, LogOut, DollarSign, Shield, Zap, History, Menu, X,
} from 'lucide-react';

const navSections = [
  {
    title: 'Core',
    items: [
      { path: '/dashboard', label: 'Command Center', icon: Brain },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { path: '/dashboard/cost-analytics', label: 'Cost Analytics', icon: BarChart3 },
      { path: '/dashboard/usage-monitoring', label: 'Usage Monitoring', icon: Activity },
      { path: '/dashboard/benchmarks', label: 'Model Benchmarks', icon: Award },
      { path: '/dashboard/token-analysis', label: 'Token Analysis', icon: Hash },
      { path: '/dashboard/team-reports', label: 'Team Reports', icon: Users },
    ],
  },
  {
    title: 'Optimization',
    items: [
      { path: '/dashboard/routing-rules', label: 'Routing Rules', icon: GitBranch },
      { path: '/dashboard/budget-alerts', label: 'Budget Alerts', icon: Bell },
      { path: '/dashboard/ab-testing', label: 'A/B Testing', icon: FlaskConical },
      { path: '/dashboard/optimizations', label: 'Optimizations', icon: TrendingDown },
      { path: '/dashboard/cost-forecasting', label: 'Cost Forecasting', icon: LineChart },
    ],
  },
  {
    title: 'Proxy & AI',
    items: [
      { path: '/dashboard/proxy-tester', label: 'LLM Proxy Tester', icon: Zap },
      { path: '/dashboard/ai-results', label: 'AI Results History', icon: History },
      { path: '/dashboard/ai-tools', label: 'AI Tools', icon: Wand2 },
    ],
  },
  {
    title: 'Management',
    items: [
      { path: '/dashboard/models', label: 'Model Registry', icon: Brain },
      { path: '/dashboard/api-keys', label: 'API Keys', icon: Key },
      { path: '/dashboard/prompt-optimization', label: 'Prompt Optimizer', icon: Wand2 },
      { path: '/dashboard/cache-management', label: 'Cache Management', icon: Database },
      { path: '/dashboard/rate-limiting', label: 'Rate Limiting', icon: Gauge },
      { path: '/dashboard/cost-allocation', label: 'Cost Allocation', icon: PieChart },
      { path: '/dashboard/production-controls', label: 'Production Controls', icon: Shield },
    ],
  },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        minWidth: 240,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-secondary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <div style={{ background: 'var(--accent-gradient)', borderRadius: 10, padding: 8, display: 'flex' }}>
              <Brain size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI Orchestrator</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cost Intelligence</div>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navSections.map((section) => (
            <div key={section.title} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px', marginBottom: 4 }}>
                {section.title}
              </div>
              {section.items.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-secondary)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {user?.name || user?.email || 'User'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{user?.role || 'admin'}</div>
          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              borderRadius: 6, border: '1px solid var(--border-secondary)',
              background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
