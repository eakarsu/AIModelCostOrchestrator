const express = require('express');
const router = express.Router();

router.post('/evaluate', (req, res) => {
  const { requestsPerMinute = 0, avgTokens = 0, modelCostPer1k = 0.002, latencyP95Ms = 0, monthlyBudget = 1000, slaMs = 2000 } = req.body || {};
  const rpm = Number(requestsPerMinute);
  const dailyCost = rpm * 60 * 24 * Number(avgTokens) / 1000 * Number(modelCostPer1k);
  const projectedMonthlyCost = dailyCost * 30;
  const budgetPressure = monthlyBudget ? projectedMonthlyCost / Number(monthlyBudget) : 1;
  const latencyPressure = Number(latencyP95Ms) / Number(slaMs || 1);
  const score = Math.round(Math.min(100, Math.max(budgetPressure, latencyPressure) * 100));
  res.json({
    feature: 'SLA Cost Guardrail',
    projectedMonthlyCost: Number(projectedMonthlyCost.toFixed(2)),
    score,
    band: score >= 100 ? 'block or reroute' : score >= 80 ? 'throttle' : 'allow',
    actions: [
      budgetPressure > 0.8 ? 'Route low-risk traffic to cheaper model tier.' : 'Budget pressure within policy.',
      latencyPressure > 1 ? 'Enable fallback model for p95 latency breach.' : 'Latency within SLA.',
      'Log policy decision for chargeback review.',
    ],
  });
});

module.exports = router;
