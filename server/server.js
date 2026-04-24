const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: `http://localhost:${process.env.CLIENT_PORT || 3000}`,
  credentials: true
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
