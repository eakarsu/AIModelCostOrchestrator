const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = require('./db');
const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/models', require('./routes/models'));
app.use('/api/cost-analytics', require('./routes/cost-analytics'));
app.use('/api/optimizations', require('./routes/optimization'));
app.use('/api/benchmarks', require('./routes/benchmarks'));
app.use('/api/usage-monitoring', require('./routes/usage-monitoring'));
app.use('/api/budget-alerts', require('./routes/budget-alerts'));
app.use('/api/routing-rules', require('./routes/routing-rules'));
app.use('/api/token-analysis', require('./routes/token-analysis'));
app.use('/api/cost-forecasting', require('./routes/cost-forecasting'));
app.use('/api/ab-testing', require('./routes/ab-testing'));
app.use('/api/api-keys', require('./routes/api-keys'));
app.use('/api/team-reports', require('./routes/team-reports'));
app.use('/api/prompt-optimization', require('./routes/prompt-optimization'));
app.use('/api/cache-management', require('./routes/cache-management'));
app.use('/api/rate-limiting', require('./routes/rate-limiting'));
app.use('/api/cost-allocation', require('./routes/cost-allocation'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/ai-results', require('./routes/ai-results'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sla-cost-guardrail', require('./routes/sla-cost-guardrail'));
app.use('/api/cost-workflow', require('./routes/costWorkflow'));

app.use(/^\/api\/(?:gap-|agentic-model-router|realtime-cost-optimizer|budget-governor|multi-provider-arbitrage|vertical-cost-benchmark)/, (req,res,next) => {
  if (process.env.ENABLE_EXPERIMENTAL_ROUTES === 'true') return next();
  return res.status(501).json({success:false,error:'Generated/provider-backed surface is quarantined',required:'ENABLE_EXPERIMENTAL_ROUTES=true plus documented provider configuration'});
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/agentic-model-router', require('./routes/agentic-model-router'));
app.use('/api/realtime-cost-optimizer', require('./routes/realtime-cost-optimizer'));
app.use('/api/budget-governor', require('./routes/budget-governor'));
app.use('/api/multi-provider-arbitrage', require('./routes/multi-provider-arbitrage'));
app.use('/api/vertical-cost-benchmark', require('./routes/vertical-cost-benchmark'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_ai_fine_tune_roi_analyzer = require('./routes/gap-ai-fine-tune-roi-analyzer'); app.use('/api/gap-ai-fine-tune-roi-analyzer', _gap_ai_fine_tune_roi_analyzer); } catch(e) { console.error('gap mount fail ai-fine-tune-roi-analyzer:', e.message); }
try { const _gap_ai_quality_vs_cost_pareto = require('./routes/gap-ai-quality-vs-cost-pareto'); app.use('/api/gap-ai-quality-vs-cost-pareto', _gap_ai_quality_vs_cost_pareto); } catch(e) { console.error('gap mount fail ai-quality-vs-cost-pareto:', e.message); }
try { const _gap_ai_agentic_cost_governor = require('./routes/gap-ai-agentic-cost-governor'); app.use('/api/gap-ai-agentic-cost-governor', _gap_ai_agentic_cost_governor); } catch(e) { console.error('gap mount fail ai-agentic-cost-governor:', e.message); }
try { const _gap_ai_dataset_leakage_detector = require('./routes/gap-ai-dataset-leakage-detector'); app.use('/api/gap-ai-dataset-leakage-detector', _gap_ai_dataset_leakage_detector); } catch(e) { console.error('gap mount fail ai-dataset-leakage-detector:', e.message); }
try { const _gap_native = require('./routes/gap-native'); app.use('/api/gap-native', _gap_native); } catch(e) { console.error('gap mount fail native:', e.message); }
try { const _gap_saml_sso = require('./routes/gap-saml-sso'); app.use('/api/gap-saml-sso', _gap_saml_sso); } catch(e) { console.error('gap mount fail saml-sso:', e.message); }
try { const _gap_compliance = require('./routes/gap-compliance'); app.use('/api/gap-compliance', _gap_compliance); } catch(e) { console.error('gap mount fail compliance:', e.message); }
try { const _gap_mobile = require('./routes/gap-mobile'); app.use('/api/gap-mobile', _gap_mobile); } catch(e) { console.error('gap mount fail mobile:', e.message); }
try { const _gap_anomaly = require('./routes/gap-anomaly'); app.use('/api/gap-anomaly', _gap_anomaly); } catch(e) { console.error('gap mount fail anomaly:', e.message); }
// === End Batch 05 Mounts ===
