// ─── Base API Wrapper ────────────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/';
    throw new Error('Session expired');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }

  return data;
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

export function getAll(basePath) {
  return apiFetch(basePath);
}

export function getById(basePath, id) {
  return apiFetch(`${basePath}/${id}`);
}

export function create(basePath, payload) {
  return apiFetch(basePath, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function update(basePath, id, payload) {
  return apiFetch(`${basePath}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function remove(basePath, id) {
  return apiFetch(`${basePath}/${id}`, {
    method: 'DELETE',
  });
}

export function aiAction(aiEndpoint, prompt) {
  return apiFetch(aiEndpoint, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}

// ─── Feature Configurations ──────────────────────────────────────────────────

export const featureConfigs = [
  // 1. AI Model Registry
  {
    key: 'models',
    name: 'AI Model Registry',
    description: 'Track and manage all AI models with cost and performance metrics',
    path: '/api/models',
    aiEndpoint: '/api/models/ai/analyze',
    aiLabel: 'Analyze Model',
    aiPromptPlaceholder: 'Analyze cost-effectiveness of our AI models...',
    icon: 'Brain',
    color: '#6366f1',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'provider', label: 'Provider', type: 'text', required: true },
      { key: 'model_id', label: 'Model ID', type: 'text', required: true },
      { key: 'cost_per_1k_input', label: 'Cost/1K Input ($)', type: 'number', required: true },
      { key: 'cost_per_1k_output', label: 'Cost/1K Output ($)', type: 'number', required: true },
      { key: 'avg_latency_ms', label: 'Avg Latency (ms)', type: 'number' },
      { key: 'quality_score', label: 'Quality Score', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
    tableColumns: ['name', 'provider', 'cost_per_1k_input', 'cost_per_1k_output', 'quality_score', 'is_active'],
  },

  // 2. Cost Analytics
  {
    key: 'cost-analytics',
    name: 'Cost Analytics',
    description: 'Deep analytics on AI model costs across departments and time periods',
    path: '/api/cost-analytics',
    aiEndpoint: '/api/cost-analytics/ai/insights',
    aiLabel: 'Get Insights',
    aiPromptPlaceholder: 'Analyze spending patterns and identify cost anomalies...',
    icon: 'BarChart3',
    color: '#8b5cf6',
    fields: [
      { key: 'model_name', label: 'Model Name', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'tokens_used', label: 'Tokens Used', type: 'number', required: true },
      { key: 'input_tokens', label: 'Input Tokens', type: 'number' },
      { key: 'output_tokens', label: 'Output Tokens', type: 'number' },
      { key: 'total_cost', label: 'Total Cost ($)', type: 'number', required: true },
      { key: 'request_count', label: 'Request Count', type: 'number' },
      { key: 'avg_latency', label: 'Avg Latency (ms)', type: 'number' },
    ],
    tableColumns: ['model_name', 'department', 'date', 'tokens_used', 'total_cost', 'request_count'],
  },

  // 3. Cost Optimization
  {
    key: 'optimizations',
    name: 'Cost Optimization',
    description: 'AI-powered recommendations to reduce costs while maintaining quality',
    path: '/api/optimizations',
    aiEndpoint: '/api/optimizations/ai/generate',
    aiLabel: 'Generate Optimizations',
    aiPromptPlaceholder: 'Generate cost optimization strategies for our AI usage...',
    icon: 'TrendingDown',
    color: '#10b981',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'model_from', label: 'Current Model', type: 'text', required: true },
      { key: 'model_to', label: 'Recommended Model', type: 'text', required: true },
      { key: 'estimated_savings_pct', label: 'Est. Savings (%)', type: 'number', required: true },
      { key: 'estimated_savings_monthly', label: 'Est. Monthly Savings ($)', type: 'number' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'implemented', 'rejected'], required: true },
      { key: 'category', label: 'Category', type: 'text' },
    ],
    tableColumns: ['title', 'model_from', 'model_to', 'estimated_savings_pct', 'priority', 'status'],
  },

  // 4. Model Benchmarks
  {
    key: 'benchmarks',
    name: 'Model Benchmarks',
    description: 'Compare AI models on accuracy, speed, cost, and quality metrics',
    path: '/api/benchmarks',
    aiEndpoint: '/api/benchmarks/ai/compare',
    aiLabel: 'Compare Models',
    aiPromptPlaceholder: 'Compare model performance and find the best cost-quality balance...',
    icon: 'Award',
    color: '#f59e0b',
    fields: [
      { key: 'model_name', label: 'Model Name', type: 'text', required: true },
      { key: 'task_type', label: 'Task Type', type: 'text', required: true },
      { key: 'accuracy_score', label: 'Accuracy Score', type: 'number', required: true },
      { key: 'speed_ms', label: 'Speed (ms)', type: 'number', required: true },
      { key: 'cost_per_request', label: 'Cost/Request ($)', type: 'number', required: true },
      { key: 'throughput_rps', label: 'Throughput (req/s)', type: 'number' },
      { key: 'quality_rating', label: 'Quality Rating', type: 'number' },
      { key: 'test_date', label: 'Test Date', type: 'date' },
    ],
    tableColumns: ['model_name', 'task_type', 'accuracy_score', 'speed_ms', 'cost_per_request', 'quality_rating'],
  },

  // 5. Usage Monitoring
  {
    key: 'usage-monitoring',
    name: 'Usage Monitoring',
    description: 'Real-time monitoring of AI service usage, costs, and health status',
    path: '/api/usage-monitoring',
    aiEndpoint: '/api/usage-monitoring/ai/anomalies',
    aiLabel: 'Detect Anomalies',
    aiPromptPlaceholder: 'Detect unusual usage patterns and potential issues...',
    icon: 'Activity',
    color: '#06b6d4',
    fields: [
      { key: 'service_name', label: 'Service Name', type: 'text', required: true },
      { key: 'model_name', label: 'Model Name', type: 'text', required: true },
      { key: 'endpoint', label: 'Endpoint', type: 'text', required: true },
      { key: 'requests_today', label: 'Requests Today', type: 'number' },
      { key: 'tokens_today', label: 'Tokens Today', type: 'number' },
      { key: 'cost_today', label: 'Cost Today ($)', type: 'number' },
      { key: 'error_rate', label: 'Error Rate (%)', type: 'number' },
      { key: 'avg_response_time', label: 'Avg Response Time (ms)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['healthy', 'degraded', 'down'], required: true },
      { key: 'last_active', label: 'Last Active', type: 'datetime-local' },
    ],
    tableColumns: ['service_name', 'model_name', 'requests_today', 'cost_today', 'error_rate', 'status'],
  },

  // 6. Budget Alerts
  {
    key: 'budget-alerts',
    name: 'Budget Alerts',
    description: 'Set and manage budget thresholds with intelligent alerting',
    path: '/api/budget-alerts',
    aiEndpoint: '/api/budget-alerts/ai/forecast',
    aiLabel: 'Forecast Budget',
    aiPromptPlaceholder: 'Forecast budget consumption and suggest optimal thresholds...',
    icon: 'Bell',
    color: '#ef4444',
    fields: [
      { key: 'name', label: 'Alert Name', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'budget_limit', label: 'Budget Limit ($)', type: 'number', required: true },
      { key: 'current_spend', label: 'Current Spend ($)', type: 'number' },
      { key: 'alert_threshold_pct', label: 'Alert Threshold (%)', type: 'number', required: true },
      { key: 'alert_type', label: 'Alert Type', type: 'select', options: ['email', 'slack', 'webhook', 'sms'], required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'triggered', 'resolved', 'disabled'], required: true },
      { key: 'period', label: 'Period', type: 'select', options: ['daily', 'weekly', 'monthly', 'quarterly'] },
      { key: 'notified_at', label: 'Last Notified', type: 'datetime-local' },
    ],
    tableColumns: ['name', 'department', 'budget_limit', 'current_spend', 'alert_threshold_pct', 'status'],
  },

  // 7. Model Routing Rules
  {
    key: 'routing-rules',
    name: 'Model Routing Rules',
    description: 'Intelligent request routing to optimize cost and performance',
    path: '/api/routing-rules',
    aiEndpoint: '/api/routing-rules/ai/suggest',
    aiLabel: 'Suggest Rules',
    aiPromptPlaceholder: 'Suggest optimal routing rules based on usage patterns...',
    icon: 'GitBranch',
    color: '#ec4899',
    fields: [
      { key: 'name', label: 'Rule Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'condition_type', label: 'Condition Type', type: 'select', options: ['token_count', 'task_type', 'priority', 'cost_limit', 'latency_requirement'], required: true },
      { key: 'condition_value', label: 'Condition Value', type: 'text', required: true },
      { key: 'target_model', label: 'Target Model', type: 'text', required: true },
      { key: 'fallback_model', label: 'Fallback Model', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'number', required: true },
      { key: 'is_active', label: 'Active', type: 'boolean' },
      { key: 'requests_routed', label: 'Requests Routed', type: 'number' },
      { key: 'cost_saved', label: 'Cost Saved ($)', type: 'number' },
    ],
    tableColumns: ['name', 'condition_type', 'target_model', 'fallback_model', 'priority', 'is_active', 'cost_saved'],
  },

  // 8. Token Analysis
  {
    key: 'token-analysis',
    name: 'Token Analysis',
    description: 'Analyze token usage patterns to identify waste and optimization opportunities',
    path: '/api/token-analysis',
    aiEndpoint: '/api/token-analysis/ai/optimize',
    aiLabel: 'Optimize Tokens',
    aiPromptPlaceholder: 'Analyze token waste and suggest optimization strategies...',
    icon: 'Hash',
    color: '#14b8a6',
    fields: [
      { key: 'application', label: 'Application', type: 'text', required: true },
      { key: 'endpoint', label: 'Endpoint', type: 'text', required: true },
      { key: 'avg_input_tokens', label: 'Avg Input Tokens', type: 'number', required: true },
      { key: 'avg_output_tokens', label: 'Avg Output Tokens', type: 'number', required: true },
      { key: 'max_tokens_observed', label: 'Max Tokens Observed', type: 'number' },
      { key: 'waste_percentage', label: 'Waste (%)', type: 'number' },
      { key: 'optimization_potential', label: 'Optimization Potential', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'period', label: 'Period', type: 'select', options: ['daily', 'weekly', 'monthly'] },
      { key: 'analyzed_at', label: 'Analyzed At', type: 'datetime-local' },
    ],
    tableColumns: ['application', 'endpoint', 'avg_input_tokens', 'avg_output_tokens', 'waste_percentage', 'optimization_potential'],
  },

  // 9. Cost Forecasting
  {
    key: 'cost-forecasting',
    name: 'Cost Forecasting',
    description: 'Predict future AI costs with ML-powered forecasting models',
    path: '/api/cost-forecasting',
    aiEndpoint: '/api/cost-forecasting/ai/predict',
    aiLabel: 'Predict Costs',
    aiPromptPlaceholder: 'Predict future cost trends and identify potential budget issues...',
    icon: 'LineChart',
    color: '#a855f7',
    fields: [
      { key: 'model_name', label: 'Model Name', type: 'text', required: true },
      { key: 'forecast_period', label: 'Forecast Period', type: 'select', options: ['next_week', 'next_month', 'next_quarter', 'next_year'], required: true },
      { key: 'current_monthly_cost', label: 'Current Monthly Cost ($)', type: 'number', required: true },
      { key: 'projected_cost', label: 'Projected Cost ($)', type: 'number', required: true },
      { key: 'growth_rate_pct', label: 'Growth Rate (%)', type: 'number' },
      { key: 'confidence_level', label: 'Confidence Level', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'factors', label: 'Contributing Factors', type: 'textarea' },
      { key: 'scenario', label: 'Scenario', type: 'select', options: ['optimistic', 'baseline', 'pessimistic'], required: true },
    ],
    tableColumns: ['model_name', 'forecast_period', 'current_monthly_cost', 'projected_cost', 'growth_rate_pct', 'scenario'],
  },

  // 10. A/B Testing
  {
    key: 'ab-testing',
    name: 'A/B Testing',
    description: 'Run controlled experiments comparing AI model cost and performance',
    path: '/api/ab-testing',
    aiEndpoint: '/api/ab-testing/ai/recommend',
    aiLabel: 'Get Recommendations',
    aiPromptPlaceholder: 'Analyze A/B test results and recommend the best model...',
    icon: 'FlaskConical',
    color: '#f97316',
    fields: [
      { key: 'test_name', label: 'Test Name', type: 'text', required: true },
      { key: 'model_a', label: 'Model A', type: 'text', required: true },
      { key: 'model_b', label: 'Model B', type: 'text', required: true },
      { key: 'metric', label: 'Primary Metric', type: 'text', required: true },
      { key: 'model_a_score', label: 'Model A Score', type: 'number' },
      { key: 'model_b_score', label: 'Model B Score', type: 'number' },
      { key: 'model_a_cost', label: 'Model A Cost ($)', type: 'number' },
      { key: 'model_b_cost', label: 'Model B Cost ($)', type: 'number' },
      { key: 'sample_size', label: 'Sample Size', type: 'number' },
      { key: 'winner', label: 'Winner', type: 'select', options: ['model_a', 'model_b', 'inconclusive', 'pending'] },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'running', 'completed', 'cancelled'], required: true },
      { key: 'started_at', label: 'Started At', type: 'datetime-local' },
      { key: 'ended_at', label: 'Ended At', type: 'datetime-local' },
    ],
    tableColumns: ['test_name', 'model_a', 'model_b', 'model_a_score', 'model_b_score', 'winner', 'status'],
  },

  // 11. API Key Management
  {
    key: 'api-keys',
    name: 'API Key Management',
    description: 'Securely manage API keys with usage tracking and rotation policies',
    path: '/api/api-keys',
    aiEndpoint: '/api/api-keys/ai/audit',
    aiLabel: 'Audit Keys',
    aiPromptPlaceholder: 'Audit API key usage and identify security concerns...',
    icon: 'Key',
    color: '#64748b',
    fields: [
      { key: 'name', label: 'Key Name', type: 'text', required: true },
      { key: 'provider', label: 'Provider', type: 'text', required: true },
      { key: 'key_prefix', label: 'Key Prefix', type: 'text' },
      { key: 'environment', label: 'Environment', type: 'select', options: ['development', 'staging', 'production'], required: true },
      { key: 'usage_limit', label: 'Usage Limit', type: 'number' },
      { key: 'current_usage', label: 'Current Usage', type: 'number' },
      { key: 'rate_limit', label: 'Rate Limit (req/min)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'revoked', 'expired'], required: true },
      { key: 'last_used', label: 'Last Used', type: 'datetime-local' },
      { key: 'expires_at', label: 'Expires At', type: 'datetime-local' },
    ],
    tableColumns: ['name', 'provider', 'environment', 'usage_limit', 'current_usage', 'status'],
  },

  // 12. Team Reports
  {
    key: 'team-reports',
    name: 'Team Reports',
    description: 'Generate and track AI usage reports per team and department',
    path: '/api/team-reports',
    aiEndpoint: '/api/team-reports/ai/analyze',
    aiLabel: 'Analyze Teams',
    aiPromptPlaceholder: 'Analyze team usage patterns and efficiency metrics...',
    icon: 'Users',
    color: '#0ea5e9',
    fields: [
      { key: 'team_name', label: 'Team Name', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'total_requests', label: 'Total Requests', type: 'number' },
      { key: 'total_tokens', label: 'Total Tokens', type: 'number' },
      { key: 'total_cost', label: 'Total Cost ($)', type: 'number', required: true },
      { key: 'avg_cost_per_request', label: 'Avg Cost/Request ($)', type: 'number' },
      { key: 'top_model', label: 'Top Model', type: 'text' },
      { key: 'efficiency_score', label: 'Efficiency Score', type: 'number' },
      { key: 'period', label: 'Period', type: 'select', options: ['daily', 'weekly', 'monthly', 'quarterly'] },
      { key: 'report_date', label: 'Report Date', type: 'date' },
    ],
    tableColumns: ['team_name', 'department', 'total_requests', 'total_cost', 'avg_cost_per_request', 'efficiency_score'],
  },

  // 13. Prompt Optimization
  {
    key: 'prompt-optimization',
    name: 'Prompt Optimization',
    description: 'Optimize prompts to reduce token usage and costs while maintaining quality',
    path: '/api/prompt-optimization',
    aiEndpoint: '/api/prompt-optimization/ai/optimize',
    aiLabel: 'Optimize Prompt',
    aiPromptPlaceholder: 'Optimize this prompt to reduce tokens while maintaining quality...',
    icon: 'Wand2',
    color: '#d946ef',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'original_prompt', label: 'Original Prompt', type: 'textarea', required: true },
      { key: 'optimized_prompt', label: 'Optimized Prompt', type: 'textarea' },
      { key: 'original_tokens', label: 'Original Tokens', type: 'number' },
      { key: 'optimized_tokens', label: 'Optimized Tokens', type: 'number' },
      { key: 'token_reduction_pct', label: 'Token Reduction (%)', type: 'number' },
      { key: 'quality_maintained', label: 'Quality Maintained', type: 'boolean' },
      { key: 'model_used', label: 'Model Used', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
    ],
    tableColumns: ['name', 'original_tokens', 'optimized_tokens', 'token_reduction_pct', 'quality_maintained', 'model_used'],
  },

  // 14. Cache Management
  {
    key: 'cache-management',
    name: 'Cache Management',
    description: 'Manage response caching to reduce redundant API calls and costs',
    path: '/api/cache-management',
    aiEndpoint: '/api/cache-management/ai/strategy',
    aiLabel: 'Suggest Strategy',
    aiPromptPlaceholder: 'Suggest optimal caching strategies to reduce costs...',
    icon: 'Database',
    color: '#22d3ee',
    fields: [
      { key: 'cache_key', label: 'Cache Key', type: 'text', required: true },
      { key: 'endpoint', label: 'Endpoint', type: 'text', required: true },
      { key: 'hit_count', label: 'Hit Count', type: 'number' },
      { key: 'miss_count', label: 'Miss Count', type: 'number' },
      { key: 'hit_rate_pct', label: 'Hit Rate (%)', type: 'number' },
      { key: 'memory_used_mb', label: 'Memory Used (MB)', type: 'number' },
      { key: 'ttl_seconds', label: 'TTL (seconds)', type: 'number', required: true },
      { key: 'cost_saved', label: 'Cost Saved ($)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'evicted', 'disabled'], required: true },
      { key: 'last_accessed', label: 'Last Accessed', type: 'datetime-local' },
    ],
    tableColumns: ['cache_key', 'endpoint', 'hit_count', 'hit_rate_pct', 'memory_used_mb', 'cost_saved', 'status'],
  },

  // 15. Rate Limiting
  {
    key: 'rate-limiting',
    name: 'Rate Limiting',
    description: 'Configure and monitor rate limits to control costs and ensure fair usage',
    path: '/api/rate-limiting',
    aiEndpoint: '/api/rate-limiting/ai/recommend',
    aiLabel: 'Recommend Limits',
    aiPromptPlaceholder: 'Recommend optimal rate limits based on usage patterns...',
    icon: 'Gauge',
    color: '#f43f5e',
    fields: [
      { key: 'name', label: 'Rule Name', type: 'text', required: true },
      { key: 'service', label: 'Service', type: 'text', required: true },
      { key: 'tier', label: 'Tier', type: 'select', options: ['free', 'basic', 'pro', 'enterprise'], required: true },
      { key: 'requests_per_minute', label: 'Requests/Minute', type: 'number', required: true },
      { key: 'requests_per_hour', label: 'Requests/Hour', type: 'number' },
      { key: 'tokens_per_minute', label: 'Tokens/Minute', type: 'number' },
      { key: 'burst_limit', label: 'Burst Limit', type: 'number' },
      { key: 'current_usage_pct', label: 'Current Usage (%)', type: 'number' },
      { key: 'throttled_count', label: 'Throttled Count', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'enforcing', 'monitoring'], required: true },
    ],
    tableColumns: ['name', 'service', 'tier', 'requests_per_minute', 'current_usage_pct', 'throttled_count', 'status'],
  },

  // 16. Cost Allocation
  {
    key: 'cost-allocation',
    name: 'Cost Allocation',
    description: 'Allocate and track AI costs across projects, teams, and departments',
    path: '/api/cost-allocation',
    aiEndpoint: '/api/cost-allocation/ai/optimize',
    aiLabel: 'Optimize Allocation',
    aiPromptPlaceholder: 'Optimize cost allocation and identify budget variances...',
    icon: 'PieChart',
    color: '#84cc16',
    fields: [
      { key: 'tag_name', label: 'Tag Name', type: 'text', required: true },
      { key: 'project', label: 'Project', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'environment', label: 'Environment', type: 'select', options: ['development', 'staging', 'production'], required: true },
      { key: 'allocated_budget', label: 'Allocated Budget ($)', type: 'number', required: true },
      { key: 'actual_spend', label: 'Actual Spend ($)', type: 'number' },
      { key: 'variance_pct', label: 'Variance (%)', type: 'number' },
      { key: 'models_used', label: 'Models Used', type: 'number' },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'over_budget', 'under_budget', 'closed'], required: true },
      { key: 'period', label: 'Period', type: 'select', options: ['monthly', 'quarterly', 'annual'] },
    ],
    tableColumns: ['tag_name', 'project', 'department', 'allocated_budget', 'actual_spend', 'variance_pct', 'status'],
  },
];

// Helper to get a feature config by key
export function getFeatureConfig(key) {
  return featureConfigs.find((f) => f.key === key);
}
