const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  console.log('Starting database seed...');

  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_models (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(255) NOT NULL,
        model_id VARCHAR(255) NOT NULL,
        cost_per_1k_input DECIMAL(10,6) DEFAULT 0,
        cost_per_1k_output DECIMAL(10,6) DEFAULT 0,
        avg_latency_ms INTEGER DEFAULT 0,
        quality_score DECIMAL(3,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cost_analytics (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        date DATE NOT NULL,
        tokens_used BIGINT DEFAULT 0,
        input_tokens BIGINT DEFAULT 0,
        output_tokens BIGINT DEFAULT 0,
        total_cost DECIMAL(12,4) DEFAULT 0,
        request_count INTEGER DEFAULT 0,
        avg_latency DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS optimizations (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        model_from VARCHAR(255),
        model_to VARCHAR(255),
        estimated_savings_pct DECIMAL(5,2) DEFAULT 0,
        estimated_savings_monthly DECIMAL(12,2) DEFAULT 0,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS benchmarks (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        task_type VARCHAR(255) NOT NULL,
        accuracy_score DECIMAL(5,2) DEFAULT 0,
        speed_ms INTEGER DEFAULT 0,
        cost_per_request DECIMAL(10,6) DEFAULT 0,
        throughput_rps DECIMAL(10,2) DEFAULT 0,
        quality_rating DECIMAL(3,2) DEFAULT 0,
        test_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usage_monitoring (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(255) NOT NULL,
        model_name VARCHAR(255) NOT NULL,
        endpoint VARCHAR(500),
        requests_today INTEGER DEFAULT 0,
        tokens_today BIGINT DEFAULT 0,
        cost_today DECIMAL(10,4) DEFAULT 0,
        error_rate DECIMAL(5,2) DEFAULT 0,
        avg_response_time DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        last_active TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS budget_alerts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        budget_limit DECIMAL(12,2) DEFAULT 0,
        current_spend DECIMAL(12,2) DEFAULT 0,
        alert_threshold_pct DECIMAL(5,2) DEFAULT 80,
        alert_type VARCHAR(50) DEFAULT 'warning',
        status VARCHAR(50) DEFAULT 'active',
        period VARCHAR(50) DEFAULT 'monthly',
        notified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS routing_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        condition_type VARCHAR(100),
        condition_value VARCHAR(255),
        target_model VARCHAR(255),
        fallback_model VARCHAR(255),
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        requests_routed INTEGER DEFAULT 0,
        cost_saved DECIMAL(12,4) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS token_analysis (
        id SERIAL PRIMARY KEY,
        application VARCHAR(255) NOT NULL,
        endpoint VARCHAR(500),
        avg_input_tokens INTEGER DEFAULT 0,
        avg_output_tokens INTEGER DEFAULT 0,
        max_tokens_observed INTEGER DEFAULT 0,
        waste_percentage DECIMAL(5,2) DEFAULT 0,
        optimization_potential VARCHAR(50),
        period VARCHAR(50) DEFAULT 'weekly',
        analyzed_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cost_forecasting (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(255) NOT NULL,
        forecast_period VARCHAR(50),
        current_monthly_cost DECIMAL(12,2) DEFAULT 0,
        projected_cost DECIMAL(12,2) DEFAULT 0,
        growth_rate_pct DECIMAL(5,2) DEFAULT 0,
        confidence_level DECIMAL(5,2) DEFAULT 0,
        factors TEXT,
        scenario VARCHAR(50) DEFAULT 'baseline',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ab_testing (
        id SERIAL PRIMARY KEY,
        test_name VARCHAR(255) NOT NULL,
        model_a VARCHAR(255),
        model_b VARCHAR(255),
        metric VARCHAR(255),
        model_a_score DECIMAL(5,2) DEFAULT 0,
        model_b_score DECIMAL(5,2) DEFAULT 0,
        model_a_cost DECIMAL(10,4) DEFAULT 0,
        model_b_cost DECIMAL(10,4) DEFAULT 0,
        sample_size INTEGER DEFAULT 0,
        winner VARCHAR(255),
        status VARCHAR(50) DEFAULT 'running',
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        provider VARCHAR(255),
        key_prefix VARCHAR(50),
        environment VARCHAR(50) DEFAULT 'production',
        usage_limit INTEGER DEFAULT 0,
        current_usage INTEGER DEFAULT 0,
        rate_limit INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        last_used TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS team_reports (
        id SERIAL PRIMARY KEY,
        team_name VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        total_requests INTEGER DEFAULT 0,
        total_tokens BIGINT DEFAULT 0,
        total_cost DECIMAL(12,2) DEFAULT 0,
        avg_cost_per_request DECIMAL(10,6) DEFAULT 0,
        top_model VARCHAR(255),
        efficiency_score DECIMAL(5,2) DEFAULT 0,
        period VARCHAR(50) DEFAULT 'monthly',
        report_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prompt_optimization (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        original_prompt TEXT,
        optimized_prompt TEXT,
        original_tokens INTEGER DEFAULT 0,
        optimized_tokens INTEGER DEFAULT 0,
        token_reduction_pct DECIMAL(5,2) DEFAULT 0,
        quality_maintained BOOLEAN DEFAULT true,
        model_used VARCHAR(255),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cache_management (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(500) NOT NULL,
        endpoint VARCHAR(500),
        hit_count INTEGER DEFAULT 0,
        miss_count INTEGER DEFAULT 0,
        hit_rate_pct DECIMAL(5,2) DEFAULT 0,
        memory_used_mb DECIMAL(10,2) DEFAULT 0,
        ttl_seconds INTEGER DEFAULT 3600,
        cost_saved DECIMAL(10,4) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        last_accessed TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rate_limiting (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        service VARCHAR(255),
        tier VARCHAR(50) DEFAULT 'standard',
        requests_per_minute INTEGER DEFAULT 0,
        requests_per_hour INTEGER DEFAULT 0,
        tokens_per_minute INTEGER DEFAULT 0,
        burst_limit INTEGER DEFAULT 0,
        current_usage_pct DECIMAL(5,2) DEFAULT 0,
        throttled_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cost_allocation (
        id SERIAL PRIMARY KEY,
        tag_name VARCHAR(255) NOT NULL,
        project VARCHAR(255),
        department VARCHAR(255),
        environment VARCHAR(50) DEFAULT 'production',
        allocated_budget DECIMAL(12,2) DEFAULT 0,
        actual_spend DECIMAL(12,2) DEFAULT 0,
        variance_pct DECIMAL(5,2) DEFAULT 0,
        models_used TEXT,
        owner VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        period VARCHAR(50) DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('All tables created successfully.');

    // Seed admin user
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [process.env.DEFAULT_EMAIL]);
    if (existingAdmin.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD, salt);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Admin', process.env.DEFAULT_EMAIL, hashedPassword, 'admin']
      );
      console.log('Admin user created.');
    } else {
      console.log('Admin user already exists.');
    }

    // Seed AI Models (15 rows)
    const modelsCount = await pool.query('SELECT COUNT(*) FROM ai_models');
    if (parseInt(modelsCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO ai_models (name, provider, model_id, cost_per_1k_input, cost_per_1k_output, avg_latency_ms, quality_score, is_active) VALUES
        ('GPT-4 Turbo', 'OpenAI', 'gpt-4-turbo', 0.010000, 0.030000, 850, 0.95, true),
        ('GPT-4o', 'OpenAI', 'gpt-4o', 0.005000, 0.015000, 620, 0.94, true),
        ('GPT-4o Mini', 'OpenAI', 'gpt-4o-mini', 0.000150, 0.000600, 380, 0.87, true),
        ('GPT-3.5 Turbo', 'OpenAI', 'gpt-3.5-turbo', 0.000500, 0.001500, 320, 0.82, true),
        ('Claude 3.5 Sonnet', 'Anthropic', 'claude-3-5-sonnet-20241022', 0.003000, 0.015000, 710, 0.96, true),
        ('Claude 3 Haiku', 'Anthropic', 'claude-3-haiku-20240307', 0.000250, 0.001250, 280, 0.85, true),
        ('Claude 3 Opus', 'Anthropic', 'claude-3-opus-20240229', 0.015000, 0.075000, 1200, 0.97, true),
        ('Gemini 1.5 Pro', 'Google', 'gemini-1.5-pro', 0.003500, 0.010500, 680, 0.93, true),
        ('Gemini 1.5 Flash', 'Google', 'gemini-1.5-flash', 0.000075, 0.000300, 250, 0.84, true),
        ('Llama 3.1 405B', 'Meta', 'meta-llama/llama-3.1-405b-instruct', 0.003000, 0.003000, 900, 0.91, true),
        ('Llama 3.1 70B', 'Meta', 'meta-llama/llama-3.1-70b-instruct', 0.000590, 0.000790, 450, 0.88, true),
        ('Llama 3.1 8B', 'Meta', 'meta-llama/llama-3.1-8b-instruct', 0.000060, 0.000060, 180, 0.78, true),
        ('Mistral Large', 'Mistral', 'mistral/mistral-large-latest', 0.003000, 0.009000, 650, 0.90, true),
        ('Mixtral 8x7B', 'Mistral', 'mistralai/mixtral-8x7b-instruct', 0.000240, 0.000240, 350, 0.83, true),
        ('Command R+', 'Cohere', 'cohere/command-r-plus', 0.003000, 0.015000, 780, 0.89, true)
      `);
      console.log('AI Models seeded.');
    }

    // Seed Cost Analytics (15 rows)
    const costCount = await pool.query('SELECT COUNT(*) FROM cost_analytics');
    if (parseInt(costCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO cost_analytics (model_name, department, date, tokens_used, input_tokens, output_tokens, total_cost, request_count, avg_latency) VALUES
        ('GPT-4 Turbo', 'Engineering', '2025-03-01', 2450000, 1800000, 650000, 37.50, 4200, 845.30),
        ('GPT-4o', 'Engineering', '2025-03-01', 3100000, 2200000, 900000, 24.50, 5800, 615.20),
        ('Claude 3.5 Sonnet', 'Product', '2025-03-01', 1890000, 1400000, 490000, 11.55, 3200, 705.40),
        ('GPT-4o Mini', 'Customer Support', '2025-03-01', 5200000, 3800000, 1400000, 1.41, 12500, 375.60),
        ('Claude 3 Haiku', 'Marketing', '2025-03-01', 4100000, 3000000, 1100000, 2.13, 9800, 278.90),
        ('Gemini 1.5 Pro', 'Data Science', '2025-03-02', 1750000, 1300000, 450000, 9.28, 2900, 682.10),
        ('GPT-4 Turbo', 'Product', '2025-03-02', 1200000, 900000, 300000, 18.00, 2100, 860.50),
        ('Llama 3.1 70B', 'Engineering', '2025-03-02', 2800000, 2000000, 800000, 1.81, 4500, 448.30),
        ('Claude 3.5 Sonnet', 'Engineering', '2025-03-03', 2100000, 1500000, 600000, 13.50, 3800, 718.60),
        ('GPT-4o', 'Marketing', '2025-03-03', 1600000, 1100000, 500000, 13.00, 3200, 625.40),
        ('Mistral Large', 'Finance', '2025-03-03', 980000, 720000, 260000, 4.50, 1800, 645.80),
        ('GPT-3.5 Turbo', 'Customer Support', '2025-03-04', 6500000, 4800000, 1700000, 4.95, 15200, 318.20),
        ('Gemini 1.5 Flash', 'Operations', '2025-03-04', 7200000, 5400000, 1800000, 0.95, 18000, 248.60),
        ('Claude 3 Opus', 'Research', '2025-03-04', 580000, 420000, 160000, 18.30, 850, 1195.40),
        ('Llama 3.1 405B', 'Data Science', '2025-03-05', 1400000, 1000000, 400000, 4.20, 2200, 895.70)
      `);
      console.log('Cost Analytics seeded.');
    }

    // Seed Optimizations (15 rows)
    const optCount = await pool.query('SELECT COUNT(*) FROM optimizations');
    if (parseInt(optCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO optimizations (title, description, model_from, model_to, estimated_savings_pct, estimated_savings_monthly, priority, status, category) VALUES
        ('Migrate simple queries to GPT-4o Mini', 'Route classification and simple Q&A tasks from GPT-4 Turbo to GPT-4o Mini for 90%+ cost reduction on qualifying requests', 'GPT-4 Turbo', 'GPT-4o Mini', 85.00, 4200.00, 'high', 'approved', 'model-migration'),
        ('Switch marketing content to Claude 3.5 Sonnet', 'Marketing content generation shows comparable quality at lower cost with Claude 3.5 Sonnet vs GPT-4 Turbo', 'GPT-4 Turbo', 'Claude 3.5 Sonnet', 45.00, 1890.00, 'high', 'in-progress', 'model-migration'),
        ('Implement response caching for FAQ endpoints', 'Cache frequently asked questions to avoid redundant API calls, estimated 40% request reduction', 'N/A', 'N/A', 40.00, 3200.00, 'high', 'pending', 'caching'),
        ('Optimize prompt templates for customer support', 'Reduce average prompt length by 35% through template optimization without quality loss', 'GPT-4o', 'GPT-4o', 35.00, 950.00, 'medium', 'approved', 'prompt-optimization'),
        ('Batch processing for non-urgent analytics', 'Move non-time-sensitive analytics to batch processing during off-peak hours for volume discounts', 'Claude 3.5 Sonnet', 'Claude 3 Haiku', 60.00, 2100.00, 'medium', 'pending', 'architecture'),
        ('Use Gemini Flash for data extraction', 'Data extraction tasks can use Gemini 1.5 Flash instead of Pro with minimal quality impact', 'Gemini 1.5 Pro', 'Gemini 1.5 Flash', 92.00, 1650.00, 'high', 'approved', 'model-migration'),
        ('Implement semantic caching layer', 'Deploy semantic similarity caching to serve similar prompts from cache', 'N/A', 'N/A', 25.00, 1800.00, 'medium', 'in-progress', 'caching'),
        ('Consolidate duplicate API calls', 'Engineering team making duplicate calls for same data across microservices', 'GPT-4o', 'GPT-4o', 30.00, 720.00, 'medium', 'pending', 'architecture'),
        ('Migrate research summaries to Llama 3.1', 'Internal research summaries can use open-source Llama 3.1 405B at reduced cost', 'Claude 3 Opus', 'Llama 3.1 405B', 55.00, 2800.00, 'low', 'pending', 'model-migration'),
        ('Token limit enforcement on user inputs', 'Implement max token limits on user-facing inputs to prevent token waste', 'N/A', 'N/A', 15.00, 480.00, 'low', 'approved', 'governance'),
        ('Downgrade dev environment to smaller models', 'Development and staging environments do not need production-grade models', 'GPT-4 Turbo', 'GPT-3.5 Turbo', 75.00, 1200.00, 'medium', 'completed', 'environment'),
        ('Implement request deduplication', 'Add deduplication layer to prevent identical requests within 5-second windows', 'N/A', 'N/A', 12.00, 560.00, 'low', 'pending', 'architecture'),
        ('Switch sentiment analysis to fine-tuned model', 'Fine-tuned smaller model outperforms general-purpose for sentiment tasks', 'GPT-4o', 'GPT-3.5 Turbo (fine-tuned)', 70.00, 980.00, 'medium', 'in-progress', 'model-migration'),
        ('Reduce context window for chat summaries', 'Chat summary generation uses excessive context; limit to last 20 messages', 'Claude 3.5 Sonnet', 'Claude 3.5 Sonnet', 40.00, 620.00, 'low', 'pending', 'prompt-optimization'),
        ('Implement tiered model routing', 'Auto-route requests based on complexity scoring to appropriate model tier', 'N/A', 'N/A', 35.00, 3500.00, 'high', 'approved', 'routing')
      `);
      console.log('Optimizations seeded.');
    }

    // Seed Benchmarks (15 rows)
    const benchCount = await pool.query('SELECT COUNT(*) FROM benchmarks');
    if (parseInt(benchCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO benchmarks (model_name, task_type, accuracy_score, speed_ms, cost_per_request, throughput_rps, quality_rating, test_date) VALUES
        ('GPT-4 Turbo', 'Text Classification', 94.50, 820, 0.002100, 12.50, 0.95, '2025-03-01'),
        ('GPT-4o', 'Text Classification', 93.80, 580, 0.001050, 18.20, 0.94, '2025-03-01'),
        ('GPT-4o Mini', 'Text Classification', 89.20, 350, 0.000120, 35.00, 0.87, '2025-03-01'),
        ('Claude 3.5 Sonnet', 'Code Generation', 96.10, 720, 0.004500, 14.80, 0.96, '2025-03-02'),
        ('GPT-4 Turbo', 'Code Generation', 93.40, 950, 0.005200, 10.20, 0.93, '2025-03-02'),
        ('Claude 3 Haiku', 'Summarization', 87.60, 260, 0.000380, 42.00, 0.86, '2025-03-02'),
        ('Gemini 1.5 Pro', 'Question Answering', 92.30, 650, 0.003200, 16.50, 0.92, '2025-03-03'),
        ('Claude 3 Opus', 'Complex Reasoning', 97.80, 1180, 0.018500, 6.80, 0.98, '2025-03-03'),
        ('Llama 3.1 70B', 'Text Generation', 88.90, 420, 0.000650, 28.50, 0.88, '2025-03-03'),
        ('Mistral Large', 'Translation', 91.20, 620, 0.002800, 17.80, 0.91, '2025-03-04'),
        ('Gemini 1.5 Flash', 'Data Extraction', 85.40, 230, 0.000085, 52.00, 0.84, '2025-03-04'),
        ('GPT-4o', 'Summarization', 93.10, 540, 0.001200, 20.50, 0.93, '2025-03-04'),
        ('Llama 3.1 405B', 'Complex Reasoning', 92.80, 880, 0.003600, 11.20, 0.92, '2025-03-05'),
        ('Mixtral 8x7B', 'Text Classification', 84.50, 320, 0.000180, 38.00, 0.83, '2025-03-05'),
        ('Command R+', 'RAG Retrieval', 90.60, 750, 0.004200, 13.80, 0.90, '2025-03-05')
      `);
      console.log('Benchmarks seeded.');
    }

    // Seed Usage Monitoring (15 rows)
    const usageCount = await pool.query('SELECT COUNT(*) FROM usage_monitoring');
    if (parseInt(usageCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO usage_monitoring (service_name, model_name, endpoint, requests_today, tokens_today, cost_today, error_rate, avg_response_time, status, last_active) VALUES
        ('Customer Support Bot', 'GPT-4o Mini', '/api/chat/support', 8500, 4250000, 1.15, 0.30, 385.20, 'active', NOW() - INTERVAL '2 minutes'),
        ('Content Generator', 'Claude 3.5 Sonnet', '/api/content/generate', 2200, 3300000, 14.85, 0.80, 720.50, 'active', NOW() - INTERVAL '5 minutes'),
        ('Code Assistant', 'GPT-4 Turbo', '/api/code/complete', 3400, 5100000, 51.00, 1.20, 850.30, 'active', NOW() - INTERVAL '1 minute'),
        ('Search Engine', 'Gemini 1.5 Pro', '/api/search/semantic', 4800, 2400000, 8.40, 0.50, 680.10, 'active', NOW() - INTERVAL '30 seconds'),
        ('Email Summarizer', 'Claude 3 Haiku', '/api/email/summarize', 12000, 6000000, 1.50, 0.20, 275.40, 'active', NOW() - INTERVAL '10 seconds'),
        ('Data Analyst', 'GPT-4o', '/api/data/analyze', 1800, 2700000, 13.50, 0.90, 625.80, 'active', NOW() - INTERVAL '3 minutes'),
        ('Translation Service', 'Mistral Large', '/api/translate', 3200, 1600000, 4.80, 0.40, 640.20, 'active', NOW() - INTERVAL '1 minute'),
        ('Document Parser', 'Gemini 1.5 Flash', '/api/docs/parse', 15000, 7500000, 0.56, 0.15, 245.60, 'active', NOW() - INTERVAL '20 seconds'),
        ('Research Assistant', 'Claude 3 Opus', '/api/research/query', 450, 675000, 11.25, 2.10, 1190.50, 'warning', NOW() - INTERVAL '15 minutes'),
        ('Chatbot v2', 'GPT-4o', '/api/chat/v2', 6200, 9300000, 46.50, 1.50, 630.40, 'active', NOW() - INTERVAL '45 seconds'),
        ('Report Generator', 'Llama 3.1 70B', '/api/reports/generate', 980, 1470000, 0.95, 0.60, 455.30, 'active', NOW() - INTERVAL '8 minutes'),
        ('Sentiment Analyzer', 'GPT-3.5 Turbo', '/api/sentiment', 9500, 4750000, 2.38, 0.25, 315.70, 'active', NOW() - INTERVAL '1 minute'),
        ('Image Descriptor', 'GPT-4o', '/api/image/describe', 1200, 1800000, 9.00, 3.50, 1450.20, 'warning', NOW() - INTERVAL '30 minutes'),
        ('FAQ Bot', 'GPT-4o Mini', '/api/faq', 22000, 11000000, 2.97, 0.10, 360.80, 'active', NOW() - INTERVAL '5 seconds'),
        ('Compliance Checker', 'Claude 3.5 Sonnet', '/api/compliance/check', 850, 1275000, 5.74, 0.70, 735.90, 'active', NOW() - INTERVAL '12 minutes')
      `);
      console.log('Usage Monitoring seeded.');
    }

    // Seed Budget Alerts (15 rows)
    const budgetCount = await pool.query('SELECT COUNT(*) FROM budget_alerts');
    if (parseInt(budgetCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO budget_alerts (name, department, budget_limit, current_spend, alert_threshold_pct, alert_type, status, period, notified_at) VALUES
        ('Engineering Monthly Budget', 'Engineering', 15000.00, 12450.00, 80, 'warning', 'triggered', 'monthly', NOW() - INTERVAL '2 hours'),
        ('Product Team Budget', 'Product', 8000.00, 5200.00, 80, 'warning', 'active', 'monthly', NULL),
        ('Customer Support AI Budget', 'Customer Support', 5000.00, 4800.00, 90, 'critical', 'triggered', 'monthly', NOW() - INTERVAL '30 minutes'),
        ('Marketing Content Budget', 'Marketing', 6000.00, 3100.00, 80, 'warning', 'active', 'monthly', NULL),
        ('Data Science Budget', 'Data Science', 10000.00, 7800.00, 75, 'warning', 'triggered', 'monthly', NOW() - INTERVAL '6 hours'),
        ('Research Department Budget', 'Research', 20000.00, 18500.00, 85, 'critical', 'triggered', 'monthly', NOW() - INTERVAL '1 hour'),
        ('Finance Team Budget', 'Finance', 3000.00, 1200.00, 80, 'warning', 'active', 'monthly', NULL),
        ('Operations AI Budget', 'Operations', 4000.00, 2800.00, 70, 'warning', 'active', 'monthly', NULL),
        ('HR Automation Budget', 'Human Resources', 2000.00, 950.00, 80, 'warning', 'active', 'monthly', NULL),
        ('Legal Review Budget', 'Legal', 5000.00, 4200.00, 80, 'warning', 'triggered', 'monthly', NOW() - INTERVAL '4 hours'),
        ('Sales AI Assistant Budget', 'Sales', 7000.00, 6850.00, 90, 'critical', 'triggered', 'monthly', NOW() - INTERVAL '15 minutes'),
        ('QA Testing Budget', 'Quality Assurance', 3500.00, 1800.00, 80, 'warning', 'active', 'monthly', NULL),
        ('DevOps Automation Budget', 'DevOps', 4500.00, 3600.00, 75, 'warning', 'triggered', 'monthly', NOW() - INTERVAL '3 hours'),
        ('Executive Dashboard Budget', 'Executive', 2500.00, 800.00, 80, 'warning', 'active', 'monthly', NULL),
        ('Company-Wide Weekly Alert', 'All Departments', 25000.00, 22100.00, 85, 'critical', 'triggered', 'weekly', NOW() - INTERVAL '1 hour')
      `);
      console.log('Budget Alerts seeded.');
    }

    // Seed Routing Rules (15 rows)
    const routingCount = await pool.query('SELECT COUNT(*) FROM routing_rules');
    if (parseInt(routingCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO routing_rules (name, description, condition_type, condition_value, target_model, fallback_model, priority, is_active, requests_routed, cost_saved) VALUES
        ('Simple Classification Route', 'Route simple text classification to cheapest model', 'task_type', 'classification', 'GPT-4o Mini', 'GPT-3.5 Turbo', 1, true, 45000, 1250.50),
        ('Complex Reasoning Route', 'Route complex reasoning tasks to highest quality model', 'complexity', 'high', 'Claude 3 Opus', 'GPT-4 Turbo', 2, true, 8500, 0.00),
        ('Cost-Sensitive Route', 'Route cost-sensitive departments to budget models', 'department', 'customer_support', 'GPT-4o Mini', 'Claude 3 Haiku', 3, true, 62000, 3200.80),
        ('Latency-Critical Route', 'Route real-time requests to fastest models', 'latency_requirement', 'under_500ms', 'Gemini 1.5 Flash', 'Claude 3 Haiku', 1, true, 38000, 890.20),
        ('Code Generation Route', 'Route all code tasks to best coding model', 'task_type', 'code_generation', 'Claude 3.5 Sonnet', 'GPT-4 Turbo', 2, true, 15000, 420.60),
        ('Bulk Processing Route', 'Route batch jobs to cost-effective models', 'batch_size', 'over_100', 'Llama 3.1 70B', 'Mixtral 8x7B', 4, true, 25000, 2100.40),
        ('Premium User Route', 'Route premium tier users to best models', 'user_tier', 'premium', 'GPT-4o', 'Claude 3.5 Sonnet', 1, true, 12000, 0.00),
        ('Summarization Route', 'Route summarization to efficient model', 'task_type', 'summarization', 'Claude 3 Haiku', 'Gemini 1.5 Flash', 3, true, 28000, 1680.90),
        ('Translation Route', 'Route translation tasks to specialized model', 'task_type', 'translation', 'Mistral Large', 'GPT-4o', 3, true, 9500, 350.20),
        ('Off-Peak Route', 'Route off-peak requests to cheaper models', 'time_window', 'off_peak', 'Llama 3.1 8B', 'GPT-4o Mini', 5, true, 18000, 780.50),
        ('RAG Pipeline Route', 'Route RAG queries to optimized model', 'task_type', 'rag_retrieval', 'Command R+', 'Gemini 1.5 Pro', 2, true, 11000, 520.30),
        ('Error Fallback Route', 'Fallback route when primary model errors', 'error_rate', 'above_5pct', 'GPT-4o', 'Claude 3.5 Sonnet', 1, true, 3200, 0.00),
        ('Token Budget Route', 'Route based on estimated token count', 'token_estimate', 'under_500', 'GPT-4o Mini', 'Gemini 1.5 Flash', 3, true, 55000, 2800.70),
        ('Data Extraction Route', 'Route data extraction to fast model', 'task_type', 'data_extraction', 'Gemini 1.5 Flash', 'GPT-4o Mini', 2, true, 32000, 1450.60),
        ('Quality Override Route', 'Force high-quality model for critical outputs', 'quality_requirement', 'critical', 'Claude 3 Opus', 'GPT-4 Turbo', 1, false, 5000, 0.00)
      `);
      console.log('Routing Rules seeded.');
    }

    // Seed Token Analysis (15 rows)
    const tokenCount = await pool.query('SELECT COUNT(*) FROM token_analysis');
    if (parseInt(tokenCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO token_analysis (application, endpoint, avg_input_tokens, avg_output_tokens, max_tokens_observed, waste_percentage, optimization_potential, period, analyzed_at) VALUES
        ('Customer Support Bot', '/api/chat/support', 450, 280, 2800, 22.50, 'high', 'weekly', NOW() - INTERVAL '1 day'),
        ('Content Generator', '/api/content/generate', 1200, 850, 4500, 15.30, 'medium', 'weekly', NOW() - INTERVAL '1 day'),
        ('Code Assistant', '/api/code/complete', 800, 1500, 8000, 8.20, 'low', 'weekly', NOW() - INTERVAL '1 day'),
        ('Email Summarizer', '/api/email/summarize', 2500, 350, 6000, 35.40, 'high', 'weekly', NOW() - INTERVAL '2 days'),
        ('Search Engine', '/api/search/semantic', 320, 180, 1500, 12.60, 'medium', 'weekly', NOW() - INTERVAL '2 days'),
        ('Data Analyst', '/api/data/analyze', 1800, 1200, 5500, 18.90, 'high', 'weekly', NOW() - INTERVAL '2 days'),
        ('Translation Service', '/api/translate', 600, 620, 3000, 10.40, 'low', 'weekly', NOW() - INTERVAL '3 days'),
        ('Document Parser', '/api/docs/parse', 3500, 450, 8500, 28.70, 'high', 'weekly', NOW() - INTERVAL '3 days'),
        ('Research Assistant', '/api/research/query', 2200, 1800, 7000, 5.80, 'low', 'weekly', NOW() - INTERVAL '3 days'),
        ('Chatbot v2', '/api/chat/v2', 380, 420, 3200, 25.10, 'high', 'weekly', NOW() - INTERVAL '4 days'),
        ('Report Generator', '/api/reports/generate', 1500, 2200, 6500, 14.20, 'medium', 'weekly', NOW() - INTERVAL '4 days'),
        ('Sentiment Analyzer', '/api/sentiment', 280, 50, 800, 42.30, 'high', 'weekly', NOW() - INTERVAL '4 days'),
        ('FAQ Bot', '/api/faq', 150, 200, 1200, 38.50, 'high', 'weekly', NOW() - INTERVAL '5 days'),
        ('Compliance Checker', '/api/compliance/check', 3200, 600, 5000, 9.80, 'low', 'weekly', NOW() - INTERVAL '5 days'),
        ('Image Descriptor', '/api/image/describe', 500, 350, 2000, 20.60, 'medium', 'weekly', NOW() - INTERVAL '5 days')
      `);
      console.log('Token Analysis seeded.');
    }

    // Seed Cost Forecasting (15 rows)
    const forecastCount = await pool.query('SELECT COUNT(*) FROM cost_forecasting');
    if (parseInt(forecastCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO cost_forecasting (model_name, forecast_period, current_monthly_cost, projected_cost, growth_rate_pct, confidence_level, factors, scenario) VALUES
        ('GPT-4 Turbo', 'Q2 2025', 12500.00, 14800.00, 18.40, 85.00, 'Increased engineering adoption, new microservices launch', 'baseline'),
        ('GPT-4o', 'Q2 2025', 8200.00, 11500.00, 40.20, 78.00, 'Product expansion, chatbot v3 launch', 'optimistic'),
        ('Claude 3.5 Sonnet', 'Q2 2025', 6800.00, 7900.00, 16.20, 82.00, 'Content team growth, marketing automation', 'baseline'),
        ('GPT-4o Mini', 'Q2 2025', 1800.00, 3200.00, 77.80, 72.00, 'Customer support scaling, FAQ expansion', 'pessimistic'),
        ('Claude 3 Haiku', 'Q2 2025', 2400.00, 2800.00, 16.70, 88.00, 'Steady summarization workload', 'baseline'),
        ('Gemini 1.5 Pro', 'Q2 2025', 4500.00, 6200.00, 37.80, 75.00, 'Search feature expansion, new markets', 'optimistic'),
        ('Claude 3 Opus', 'Q2 2025', 8900.00, 7200.00, -19.10, 80.00, 'Migration to Claude 3.5 Sonnet for some tasks', 'optimistic'),
        ('Llama 3.1 70B', 'Q2 2025', 1200.00, 1800.00, 50.00, 70.00, 'Self-hosted infrastructure expansion', 'baseline'),
        ('Mistral Large', 'Q2 2025', 3200.00, 3800.00, 18.80, 83.00, 'Translation service growth', 'baseline'),
        ('GPT-3.5 Turbo', 'Q2 2025', 2100.00, 1400.00, -33.30, 90.00, 'Deprecation in favor of GPT-4o Mini', 'baseline'),
        ('Gemini 1.5 Flash', 'Q2 2025', 600.00, 1500.00, 150.00, 65.00, 'Data extraction pipeline expansion', 'pessimistic'),
        ('All Models Combined', 'Q2 2025', 52200.00, 62100.00, 19.00, 76.00, 'Overall company growth, new product features', 'baseline'),
        ('All Models Combined', 'Q3 2025', 52200.00, 71500.00, 37.00, 68.00, 'Aggressive growth scenario with new products', 'pessimistic'),
        ('All Models Combined', 'Q2 2025', 52200.00, 48000.00, -8.00, 72.00, 'Optimization initiatives fully implemented', 'optimistic'),
        ('Command R+', 'Q2 2025', 1800.00, 2400.00, 33.30, 74.00, 'RAG pipeline expansion, knowledge base growth', 'baseline')
      `);
      console.log('Cost Forecasting seeded.');
    }

    // Seed A/B Testing (15 rows)
    const abCount = await pool.query('SELECT COUNT(*) FROM ab_testing');
    if (parseInt(abCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO ab_testing (test_name, model_a, model_b, metric, model_a_score, model_b_score, model_a_cost, model_b_cost, sample_size, winner, status, started_at, ended_at) VALUES
        ('Support Chat Quality', 'GPT-4o', 'GPT-4o Mini', 'customer_satisfaction', 4.50, 4.20, 12.80, 1.85, 5000, 'GPT-4o Mini', 'completed', '2025-02-01', '2025-02-28'),
        ('Code Generation Accuracy', 'Claude 3.5 Sonnet', 'GPT-4 Turbo', 'accuracy', 96.20, 93.80, 8.50, 14.20, 2000, 'Claude 3.5 Sonnet', 'completed', '2025-02-10', '2025-03-01'),
        ('Summarization Speed', 'Claude 3 Haiku', 'Gemini 1.5 Flash', 'latency_p95', 82.00, 88.00, 2.10, 0.45, 8000, NULL, 'running', '2025-03-01', NULL),
        ('Translation Quality', 'Mistral Large', 'GPT-4o', 'bleu_score', 91.50, 93.20, 4.80, 9.60, 3000, NULL, 'running', '2025-03-05', NULL),
        ('RAG Retrieval Accuracy', 'Command R+', 'Gemini 1.5 Pro', 'recall_at_10', 89.40, 87.80, 6.20, 5.80, 4000, NULL, 'running', '2025-03-03', NULL),
        ('Data Extraction F1', 'Gemini 1.5 Flash', 'GPT-4o Mini', 'f1_score', 85.60, 82.30, 0.42, 0.95, 6000, 'Gemini 1.5 Flash', 'completed', '2025-01-15', '2025-02-15'),
        ('Complex Reasoning', 'Claude 3 Opus', 'GPT-4 Turbo', 'accuracy', 97.50, 94.20, 22.50, 16.80, 1000, 'Claude 3 Opus', 'completed', '2025-02-01', '2025-02-20'),
        ('Content Tone Match', 'Claude 3.5 Sonnet', 'GPT-4o', 'human_preference', 72.00, 68.00, 7.20, 8.40, 1500, NULL, 'running', '2025-03-08', NULL),
        ('Sentiment Analysis', 'GPT-3.5 Turbo', 'Llama 3.1 70B', 'accuracy', 84.20, 86.50, 1.20, 0.85, 10000, 'Llama 3.1 70B', 'completed', '2025-01-20', '2025-02-20'),
        ('Email Draft Quality', 'GPT-4o', 'Claude 3.5 Sonnet', 'human_preference', 65.00, 71.00, 6.50, 5.80, 2500, 'Claude 3.5 Sonnet', 'completed', '2025-02-05', '2025-03-05'),
        ('Batch Classification', 'GPT-4o Mini', 'Mixtral 8x7B', 'throughput', 92.00, 88.00, 0.65, 0.48, 20000, NULL, 'running', '2025-03-10', NULL),
        ('Legal Doc Review', 'Claude 3 Opus', 'Claude 3.5 Sonnet', 'precision', 98.20, 95.80, 28.50, 9.20, 500, NULL, 'running', '2025-03-12', NULL),
        ('Chatbot Engagement', 'GPT-4o', 'Gemini 1.5 Pro', 'session_length', 8.50, 7.20, 10.20, 7.80, 3500, NULL, 'running', '2025-03-07', NULL),
        ('API Response Format', 'GPT-4o Mini', 'Claude 3 Haiku', 'format_compliance', 94.80, 96.20, 1.10, 0.95, 7500, 'Claude 3 Haiku', 'completed', '2025-02-15', '2025-03-10'),
        ('Multi-turn Dialogue', 'GPT-4o', 'Claude 3.5 Sonnet', 'coherence_score', 88.50, 91.20, 15.80, 12.40, 1200, NULL, 'running', '2025-03-14', NULL)
      `);
      console.log('A/B Testing seeded.');
    }

    // Seed API Keys (15 rows)
    const apiKeysCount = await pool.query('SELECT COUNT(*) FROM api_keys');
    if (parseInt(apiKeysCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO api_keys (name, provider, key_prefix, environment, usage_limit, current_usage, rate_limit, status, last_used, expires_at) VALUES
        ('OpenAI Production Primary', 'OpenAI', 'sk-prod-****', 'production', 1000000, 742000, 10000, 'active', NOW() - INTERVAL '1 minute', '2025-12-31'),
        ('OpenAI Production Secondary', 'OpenAI', 'sk-prod2-****', 'production', 500000, 185000, 5000, 'active', NOW() - INTERVAL '5 minutes', '2025-12-31'),
        ('Anthropic Production', 'Anthropic', 'sk-ant-****', 'production', 800000, 520000, 8000, 'active', NOW() - INTERVAL '2 minutes', '2025-12-31'),
        ('Google AI Production', 'Google', 'AIza-****', 'production', 600000, 380000, 6000, 'active', NOW() - INTERVAL '30 seconds', '2025-12-31'),
        ('OpenAI Staging', 'OpenAI', 'sk-stg-****', 'staging', 100000, 45000, 2000, 'active', NOW() - INTERVAL '1 hour', '2025-12-31'),
        ('Anthropic Staging', 'Anthropic', 'sk-ant-stg-****', 'staging', 100000, 32000, 2000, 'active', NOW() - INTERVAL '2 hours', '2025-12-31'),
        ('OpenAI Development', 'OpenAI', 'sk-dev-****', 'development', 50000, 18000, 1000, 'active', NOW() - INTERVAL '30 minutes', '2025-06-30'),
        ('Cohere Production', 'Cohere', 'co-prod-****', 'production', 300000, 125000, 4000, 'active', NOW() - INTERVAL '10 minutes', '2025-12-31'),
        ('Mistral Production', 'Mistral', 'mist-****', 'production', 400000, 210000, 5000, 'active', NOW() - INTERVAL '3 minutes', '2025-12-31'),
        ('OpenAI Fine-tuning', 'OpenAI', 'sk-ft-****', 'production', 200000, 95000, 3000, 'active', NOW() - INTERVAL '6 hours', '2025-09-30'),
        ('Anthropic Development', 'Anthropic', 'sk-ant-dev-****', 'development', 50000, 8000, 1000, 'active', NOW() - INTERVAL '4 hours', '2025-06-30'),
        ('Google AI Staging', 'Google', 'AIza-stg-****', 'staging', 80000, 22000, 2000, 'active', NOW() - INTERVAL '3 hours', '2025-12-31'),
        ('Legacy OpenAI Key', 'OpenAI', 'sk-old-****', 'production', 500000, 498000, 5000, 'expiring', NOW() - INTERVAL '2 days', '2025-04-01'),
        ('Deprecated Cohere Key', 'Cohere', 'co-old-****', 'production', 200000, 200000, 3000, 'disabled', NOW() - INTERVAL '30 days', '2025-02-28'),
        ('Test Environment Key', 'OpenAI', 'sk-test-****', 'testing', 10000, 2500, 500, 'active', NOW() - INTERVAL '12 hours', '2025-12-31')
      `);
      console.log('API Keys seeded.');
    }

    // Seed Team Reports (15 rows)
    const teamCount = await pool.query('SELECT COUNT(*) FROM team_reports');
    if (parseInt(teamCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO team_reports (team_name, department, total_requests, total_tokens, total_cost, avg_cost_per_request, top_model, efficiency_score, period, report_date) VALUES
        ('Platform Engineering', 'Engineering', 125000, 187500000, 8250.00, 0.066000, 'GPT-4 Turbo', 78.50, 'monthly', '2025-03-01'),
        ('ML Infrastructure', 'Engineering', 85000, 127500000, 5100.00, 0.060000, 'Claude 3.5 Sonnet', 82.30, 'monthly', '2025-03-01'),
        ('Frontend Team', 'Engineering', 42000, 63000000, 2520.00, 0.060000, 'GPT-4o', 85.20, 'monthly', '2025-03-01'),
        ('Product Analytics', 'Product', 38000, 57000000, 2850.00, 0.075000, 'GPT-4o', 72.40, 'monthly', '2025-03-01'),
        ('Growth Team', 'Marketing', 28000, 42000000, 1890.00, 0.067500, 'Claude 3.5 Sonnet', 79.80, 'monthly', '2025-03-01'),
        ('Content Marketing', 'Marketing', 15000, 22500000, 1125.00, 0.075000, 'Claude 3.5 Sonnet', 81.60, 'monthly', '2025-03-01'),
        ('Tier 1 Support', 'Customer Support', 95000, 47500000, 1425.00, 0.015000, 'GPT-4o Mini', 92.10, 'monthly', '2025-03-01'),
        ('Tier 2 Support', 'Customer Support', 32000, 48000000, 2400.00, 0.075000, 'GPT-4o', 74.30, 'monthly', '2025-03-01'),
        ('Data Engineering', 'Data Science', 55000, 82500000, 4125.00, 0.075000, 'Gemini 1.5 Pro', 76.90, 'monthly', '2025-03-01'),
        ('Research Lab', 'Research', 12000, 18000000, 4500.00, 0.375000, 'Claude 3 Opus', 68.50, 'monthly', '2025-03-01'),
        ('Legal Operations', 'Legal', 8500, 12750000, 3825.00, 0.450000, 'Claude 3 Opus', 65.20, 'monthly', '2025-03-01'),
        ('Sales Enablement', 'Sales', 22000, 33000000, 1650.00, 0.075000, 'GPT-4o', 80.40, 'monthly', '2025-03-01'),
        ('Finance Analytics', 'Finance', 9500, 14250000, 712.50, 0.075000, 'Mistral Large', 84.70, 'monthly', '2025-03-01'),
        ('DevOps Automation', 'DevOps', 18000, 27000000, 1350.00, 0.075000, 'Llama 3.1 70B', 88.90, 'monthly', '2025-03-01'),
        ('QA Automation', 'Quality Assurance', 14000, 21000000, 840.00, 0.060000, 'GPT-4o Mini', 90.30, 'monthly', '2025-03-01')
      `);
      console.log('Team Reports seeded.');
    }

    // Seed Prompt Optimization (15 rows)
    const promptCount = await pool.query('SELECT COUNT(*) FROM prompt_optimization');
    if (parseInt(promptCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO prompt_optimization (name, original_prompt, optimized_prompt, original_tokens, optimized_tokens, token_reduction_pct, quality_maintained, model_used, category) VALUES
        ('Customer Support Greeting', 'You are a helpful customer support agent for our company. Please greet the customer warmly, acknowledge their issue, and provide a helpful response. Make sure to be empathetic and professional. The customer says:', 'Support agent. Greet warmly, acknowledge issue, respond helpfully. Customer:', 42, 12, 71.43, true, 'GPT-4o Mini', 'customer-support'),
        ('Code Review Prompt', 'Please review the following code carefully and thoroughly. Look for any bugs, security vulnerabilities, performance issues, code style problems, and suggest improvements. Provide detailed explanations for each issue found. Here is the code:', 'Review code for bugs, security issues, performance, style. Suggest fixes with explanations. Code:', 38, 15, 60.53, true, 'Claude 3.5 Sonnet', 'development'),
        ('Email Summary Template', 'I need you to read the following email thread and provide a comprehensive summary that captures all the key points, action items, decisions made, and any deadlines mentioned. Please organize it in a clear format. The email thread is:', 'Summarize email: key points, action items, decisions, deadlines. Format clearly. Email:', 42, 13, 69.05, true, 'Claude 3 Haiku', 'productivity'),
        ('Data Analysis Request', 'You are a data analyst expert. I am going to provide you with some data and I need you to analyze it thoroughly. Please identify trends, patterns, anomalies, and provide actionable insights. Use statistical reasoning where appropriate. Here is the data:', 'Analyze data: identify trends, patterns, anomalies. Provide actionable insights with statistical reasoning. Data:', 42, 15, 64.29, true, 'GPT-4o', 'analytics'),
        ('Content Generation Brief', 'Write a professional blog post about the following topic. The post should be engaging, well-structured with headings and subheadings, include relevant examples, and be optimized for SEO. Target length is around 1000 words. Topic:', 'Write 1000-word SEO blog post with headings, examples. Topic:', 38, 12, 68.42, true, 'Claude 3.5 Sonnet', 'content'),
        ('Translation Instruction', 'Please translate the following text from English to the specified target language. Maintain the original tone, style, and meaning as closely as possible. Pay special attention to idioms and cultural references. Text:', 'Translate to [language], maintaining tone, idioms, and meaning. Text:', 32, 11, 65.63, true, 'Mistral Large', 'translation'),
        ('Sentiment Classification', 'Analyze the sentiment of the following customer review. Classify it as positive, negative, or neutral. Also provide a confidence score between 0 and 1, and identify the key phrases that influenced your classification. Review:', 'Classify sentiment (positive/negative/neutral) with confidence score (0-1) and key phrases. Review:', 38, 14, 63.16, true, 'GPT-3.5 Turbo', 'classification'),
        ('Meeting Notes Formatter', 'Take the following rough meeting notes and transform them into a well-organized document with clear sections including attendees, agenda items discussed, key decisions, action items with owners and deadlines, and next steps. Notes:', 'Format meeting notes: attendees, agenda, decisions, action items (owner + deadline), next steps. Notes:', 36, 14, 61.11, true, 'Claude 3 Haiku', 'productivity'),
        ('API Documentation Generator', 'Generate comprehensive API documentation for the following endpoint. Include the endpoint URL, HTTP method, request headers, request body with all parameters and their types, response format with examples, error codes, and usage examples. Endpoint details:', 'Generate API docs: URL, method, headers, params (typed), response examples, errors, usage. Endpoint:', 40, 14, 65.00, true, 'GPT-4o', 'development'),
        ('Product Description Writer', 'Write a compelling product description for our e-commerce store. The description should highlight key features, benefits, use cases, and include a call to action. Make it persuasive but honest. Keep it under 200 words. Product:', 'Write 200-word product description: features, benefits, use cases, CTA. Product:', 38, 12, 68.42, true, 'GPT-4o Mini', 'content'),
        ('Bug Report Analyzer', 'Analyze the following bug report and provide a structured assessment including severity level, potential root causes, affected components, suggested investigation steps, and a proposed fix if possible. Bug report:', 'Assess bug: severity, root causes, affected components, investigation steps, proposed fix. Report:', 30, 13, 56.67, true, 'Claude 3.5 Sonnet', 'development'),
        ('Legal Document Summarizer', 'Summarize the following legal document in plain language that a non-lawyer can understand. Highlight the key terms, obligations, rights, potential risks, and important dates. Keep the summary concise but thorough. Document:', 'Summarize legal doc in plain language: key terms, obligations, rights, risks, dates. Document:', 32, 14, 56.25, true, 'Claude 3 Opus', 'legal'),
        ('Sales Email Generator', 'Compose a professional sales email to a potential client. The email should be personalized, reference their company and industry, highlight how our product solves their specific pain points, include social proof, and end with a clear CTA. Prospect info:', 'Write personalized sales email: reference prospect, solve pain points, add social proof, include CTA. Info:', 38, 15, 60.53, true, 'GPT-4o', 'sales'),
        ('SQL Query Builder', 'Based on the following natural language request, generate the appropriate SQL query. Use proper SQL syntax, include necessary JOINs, WHERE clauses, and GROUP BY statements as needed. Optimize the query for performance. Request:', 'Generate optimized SQL query from description. Use proper JOINs, WHERE, GROUP BY. Request:', 32, 13, 59.38, true, 'GPT-4o Mini', 'development'),
        ('Competitor Analysis Prompt', 'Conduct a thorough competitive analysis based on the following information about our competitors. Compare features, pricing, market positioning, strengths, weaknesses, and identify opportunities for differentiation. Competitor data:', 'Analyze competitors: features, pricing, positioning, SWOT, differentiation opportunities. Data:', 28, 10, 64.29, true, 'GPT-4o', 'analytics')
      `);
      console.log('Prompt Optimization seeded.');
    }

    // Seed Cache Management (15 rows)
    const cacheCount = await pool.query('SELECT COUNT(*) FROM cache_management');
    if (parseInt(cacheCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO cache_management (cache_key, endpoint, hit_count, miss_count, hit_rate_pct, memory_used_mb, ttl_seconds, cost_saved, status, last_accessed) VALUES
        ('faq:general:greeting', '/api/faq', 45200, 3800, 92.25, 2.40, 86400, 125.80, 'active', NOW() - INTERVAL '30 seconds'),
        ('faq:billing:payment', '/api/faq', 32100, 4200, 88.43, 1.80, 86400, 89.50, 'active', NOW() - INTERVAL '1 minute'),
        ('support:common:password-reset', '/api/chat/support', 28500, 5500, 83.82, 3.20, 43200, 78.40, 'active', NOW() - INTERVAL '2 minutes'),
        ('search:product:categories', '/api/search/semantic', 18900, 8100, 70.00, 5.60, 3600, 52.30, 'active', NOW() - INTERVAL '5 minutes'),
        ('translate:en-es:common', '/api/translate', 12400, 2600, 82.67, 4.80, 604800, 34.50, 'active', NOW() - INTERVAL '10 minutes'),
        ('content:template:blog-intro', '/api/content/generate', 8500, 6500, 56.67, 8.20, 1800, 23.60, 'active', NOW() - INTERVAL '15 minutes'),
        ('sentiment:cache:positive', '/api/sentiment', 52000, 8000, 86.67, 1.20, 7200, 145.00, 'active', NOW() - INTERVAL '1 minute'),
        ('code:snippet:react-hooks', '/api/code/complete', 6200, 9800, 38.75, 12.50, 900, 17.20, 'active', NOW() - INTERVAL '30 minutes'),
        ('email:template:followup', '/api/email/summarize', 15600, 4400, 78.00, 2.80, 43200, 43.40, 'active', NOW() - INTERVAL '8 minutes'),
        ('data:schema:user-table', '/api/data/analyze', 9800, 1200, 89.09, 0.60, 86400, 27.20, 'active', NOW() - INTERVAL '20 minutes'),
        ('docs:api:v2-endpoints', '/api/docs/parse', 4500, 7500, 37.50, 15.80, 600, 12.50, 'stale', NOW() - INTERVAL '2 hours'),
        ('compliance:rules:gdpr', '/api/compliance/check', 7800, 2200, 78.00, 6.40, 604800, 54.80, 'active', NOW() - INTERVAL '45 minutes'),
        ('reports:monthly:summary', '/api/reports/generate', 3200, 1800, 64.00, 9.60, 3600, 28.80, 'active', NOW() - INTERVAL '1 hour'),
        ('faq:shipping:tracking', '/api/faq', 38000, 2000, 95.00, 1.40, 86400, 105.60, 'active', NOW() - INTERVAL '15 seconds'),
        ('image:desc:product-photos', '/api/image/describe', 2100, 5900, 26.25, 18.40, 300, 14.70, 'stale', NOW() - INTERVAL '4 hours')
      `);
      console.log('Cache Management seeded.');
    }

    // Seed Rate Limiting (15 rows)
    const rateCount = await pool.query('SELECT COUNT(*) FROM rate_limiting');
    if (parseInt(rateCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO rate_limiting (name, service, tier, requests_per_minute, requests_per_hour, tokens_per_minute, burst_limit, current_usage_pct, throttled_count, status) VALUES
        ('OpenAI Production Limit', 'OpenAI API', 'enterprise', 500, 30000, 800000, 750, 72.50, 45, 'active'),
        ('Anthropic Production Limit', 'Anthropic API', 'enterprise', 400, 24000, 600000, 600, 65.30, 22, 'active'),
        ('Google AI Production Limit', 'Google AI API', 'premium', 300, 18000, 500000, 450, 58.80, 12, 'active'),
        ('Customer Support Bot Limit', 'Support Service', 'standard', 200, 12000, 300000, 300, 85.20, 128, 'active'),
        ('Content Generator Limit', 'Content Service', 'standard', 100, 6000, 400000, 150, 42.60, 8, 'active'),
        ('Code Assistant Limit', 'Code Service', 'premium', 150, 9000, 500000, 225, 68.40, 35, 'active'),
        ('Search API Limit', 'Search Service', 'standard', 250, 15000, 200000, 375, 55.20, 15, 'active'),
        ('Translation Service Limit', 'Translation Service', 'basic', 80, 4800, 150000, 120, 38.90, 5, 'active'),
        ('Data Analysis Limit', 'Analytics Service', 'premium', 120, 7200, 350000, 180, 62.10, 28, 'active'),
        ('Staging Environment Limit', 'All Staging', 'development', 50, 3000, 100000, 75, 22.40, 2, 'active'),
        ('Development Environment Limit', 'All Development', 'development', 30, 1800, 50000, 45, 15.80, 0, 'active'),
        ('Batch Processing Limit', 'Batch Service', 'standard', 60, 3600, 600000, 90, 48.50, 18, 'active'),
        ('Real-time Chat Limit', 'Chat Service', 'premium', 350, 21000, 450000, 525, 78.90, 92, 'active'),
        ('Internal Tools Limit', 'Internal APIs', 'basic', 40, 2400, 80000, 60, 28.30, 3, 'active'),
        ('Partner API Limit', 'Partner Gateway', 'enterprise', 200, 12000, 300000, 300, 45.60, 10, 'active')
      `);
      console.log('Rate Limiting seeded.');
    }

    // Seed Cost Allocation (15 rows)
    const allocCount = await pool.query('SELECT COUNT(*) FROM cost_allocation');
    if (parseInt(allocCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO cost_allocation (tag_name, project, department, environment, allocated_budget, actual_spend, variance_pct, models_used, owner, status, period) VALUES
        ('proj-customer-platform', 'Customer Platform v3', 'Engineering', 'production', 8000.00, 7200.00, -10.00, 'GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet', 'Sarah Chen', 'active', 'monthly'),
        ('proj-ai-chatbot', 'AI Chatbot Suite', 'Product', 'production', 5000.00, 5800.00, 16.00, 'GPT-4o, Claude 3 Haiku', 'Michael Torres', 'over-budget', 'monthly'),
        ('proj-content-engine', 'Content Generation Engine', 'Marketing', 'production', 4000.00, 3100.00, -22.50, 'Claude 3.5 Sonnet, GPT-4o', 'Emily Watson', 'active', 'monthly'),
        ('proj-data-pipeline', 'ML Data Pipeline', 'Data Science', 'production', 6000.00, 5500.00, -8.33, 'Gemini 1.5 Pro, Llama 3.1 70B', 'David Kim', 'active', 'monthly'),
        ('proj-support-automation', 'Support Automation', 'Customer Support', 'production', 3500.00, 4200.00, 20.00, 'GPT-4o Mini, Claude 3 Haiku', 'Lisa Anderson', 'over-budget', 'monthly'),
        ('proj-code-assistant', 'Internal Code Assistant', 'Engineering', 'production', 5500.00, 4800.00, -12.73, 'Claude 3.5 Sonnet, GPT-4 Turbo', 'James Wright', 'active', 'monthly'),
        ('proj-research-lab', 'AI Research Lab', 'Research', 'production', 10000.00, 9200.00, -8.00, 'Claude 3 Opus, GPT-4 Turbo, Llama 3.1 405B', 'Dr. Rachel Park', 'active', 'monthly'),
        ('proj-legal-review', 'Legal Document Review', 'Legal', 'production', 4000.00, 3800.00, -5.00, 'Claude 3 Opus, Claude 3.5 Sonnet', 'Robert Hughes', 'active', 'monthly'),
        ('proj-sales-enablement', 'Sales AI Enablement', 'Sales', 'production', 3000.00, 2400.00, -20.00, 'GPT-4o, Mistral Large', 'Jennifer Lopez', 'active', 'monthly'),
        ('env-staging-all', 'All Staging Environments', 'DevOps', 'staging', 2000.00, 1500.00, -25.00, 'GPT-3.5 Turbo, GPT-4o Mini', 'Alex Kumar', 'active', 'monthly'),
        ('env-dev-all', 'All Development Environments', 'DevOps', 'development', 1000.00, 650.00, -35.00, 'GPT-3.5 Turbo, Llama 3.1 8B', 'Alex Kumar', 'active', 'monthly'),
        ('proj-translation', 'Global Translation Service', 'Operations', 'production', 2500.00, 2200.00, -12.00, 'Mistral Large, GPT-4o', 'Maria Garcia', 'active', 'monthly'),
        ('proj-analytics-dashboard', 'Executive Analytics Dashboard', 'Executive', 'production', 1500.00, 800.00, -46.67, 'GPT-4o, Gemini 1.5 Pro', 'Patricia Moore', 'active', 'monthly'),
        ('proj-qa-automation', 'QA Test Automation', 'Quality Assurance', 'production', 2000.00, 1800.00, -10.00, 'GPT-4o Mini, Claude 3 Haiku', 'Thomas Clark', 'active', 'monthly'),
        ('proj-hr-assistant', 'HR Virtual Assistant', 'Human Resources', 'production', 1500.00, 950.00, -36.67, 'GPT-4o Mini, Claude 3 Haiku', 'Amanda Phillips', 'active', 'monthly')
      `);
      console.log('Cost Allocation seeded.');
    }

    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await pool.end();
  }
}

seed();
