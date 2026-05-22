const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many AI requests. Please wait before trying again.' },
  // Use user id when available, otherwise fall back to default IP key generator
  skip: () => false,
});

module.exports = { aiRateLimiter };
