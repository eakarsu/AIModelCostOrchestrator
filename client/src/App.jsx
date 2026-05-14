import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Lazy load pages
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const FeatureDetail = React.lazy(() => import('./pages/FeatureDetail'));
const CostAnalyticsPage = React.lazy(() => import('./pages/CostAnalyticsPage'));
const RoutingRulesPage = React.lazy(() => import('./pages/RoutingRulesPage'));
const BudgetAlertsPage = React.lazy(() => import('./pages/BudgetAlertsPage'));
const ABTestingPage = React.lazy(() => import('./pages/ABTestingPage'));
const UsageMonitoringPage = React.lazy(() => import('./pages/UsageMonitoringPage'));
const ProxyTesterPage = React.lazy(() => import('./pages/ProxyTesterPage'));
const AIResultsPage = React.lazy(() => import('./pages/AIResultsPage'));
const AIToolsPage = React.lazy(() => import('./pages/AIToolsPage'));

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function LoadingFallback() {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}

export default function App() {
  return (
    <React.Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/cost-analytics" element={<ProtectedRoute><CostAnalyticsPage /></ProtectedRoute>} />
        <Route path="/dashboard/routing-rules" element={<ProtectedRoute><RoutingRulesPage /></ProtectedRoute>} />
        <Route path="/dashboard/budget-alerts" element={<ProtectedRoute><BudgetAlertsPage /></ProtectedRoute>} />
        <Route path="/dashboard/ab-testing" element={<ProtectedRoute><ABTestingPage /></ProtectedRoute>} />
        <Route path="/dashboard/usage-monitoring" element={<ProtectedRoute><UsageMonitoringPage /></ProtectedRoute>} />
        <Route path="/dashboard/proxy-tester" element={<ProtectedRoute><ProxyTesterPage /></ProtectedRoute>} />
        <Route path="/dashboard/ai-results" element={<ProtectedRoute><AIResultsPage /></ProtectedRoute>} />
        <Route path="/dashboard/ai-tools" element={<ProtectedRoute><AIToolsPage /></ProtectedRoute>} />
        <Route path="/dashboard/:feature" element={<ProtectedRoute><FeatureDetail /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
}
