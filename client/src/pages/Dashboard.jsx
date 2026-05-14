import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Brain,
  BarChart3,
  TrendingDown,
  Award,
  Activity,
  Bell,
  GitBranch,
  Hash,
  LineChart,
  FlaskConical,
  Key,
  Users,
  Wand2,
  Database,
  Gauge,
  PieChart,
  LogOut,
  Zap,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Layers,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { featureConfigs } from '../services/api';

// Map string icon names from featureConfigs to actual components
const iconMap = {
  Brain,
  BarChart3,
  TrendingDown,
  Award,
  Activity,
  Bell,
  GitBranch,
  Hash,
  LineChart,
  FlaskConical,
  Key,
  Users,
  Wand2,
  Database,
  Gauge,
  PieChart,
  Lightbulb: TrendingDown,
  DollarSign,
  AlertTriangle: Bell,
  Coins: DollarSign,
  TrendingUp,
  MessageSquare: Wand2,
  Shield,
  Tags: PieChart,
};

const stats = [
  {
    label: 'Total Models Tracked',
    value: '150+',
    icon: Layers,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)',
  },
  {
    label: 'Monthly Savings',
    value: '$48,500',
    icon: DollarSign,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
  },
  {
    label: 'Cost Reduction',
    value: '42%',
    icon: TrendingUp,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  {
    label: 'Active Optimizations',
    value: '23',
    icon: Zap,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <AppLayout>
    <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <h1
            style={{
              background: 'linear-gradient(135deg, #e2e8f0, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Command Center
          </h1>
          <p>
            Monitor, optimize, and orchestrate your AI model costs from a single
            dashboard.
          </p>
        </div>

        {/* ── Stats Summary Row ──────────────────────────────────────────── */}
        <div className="stats-row">
          {stats.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div className="stat-card" key={stat.label}>
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: stat.bg,
                    }}
                  >
                    <StatIcon size={20} style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="stat-card-value">{stat.value}</div>
                <div className="stat-card-label" style={{ marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Feature Cards Grid ─────────────────────────────────────────── */}
        <div className="feature-grid">
          {featureConfigs.map((feature) => {
            const IconComponent = iconMap[feature.icon] || Brain;
            return (
              <div
                key={feature.key}
                className="feature-card"
                style={{ '--card-accent': feature.color }}
                onClick={() => navigate(`/dashboard/${feature.key}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/dashboard/${feature.key}`);
                  }
                }}
              >
                <div
                  className="feature-card-icon"
                  style={{
                    background: `${feature.color}15`,
                    color: feature.color,
                  }}
                >
                  <IconComponent size={24} />
                </div>
                <h3>{feature.name}</h3>
                <p>{feature.description}</p>
                <div
                  className="flex items-center gap-1"
                  style={{
                    marginTop: 16,
                    fontSize: 13,
                    color: feature.color,
                    fontWeight: 500,
                  }}
                >
                  <span>Explore</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--border-secondary)',
            textAlign: 'center',
          }}
        >
          <p className="text-sm text-muted">
            AI Model Cost Orchestrator &mdash; Intelligent cost management for
            enterprise AI infrastructure.
          </p>
        </footer>
      </div>
    </AppLayout>
  );
}
