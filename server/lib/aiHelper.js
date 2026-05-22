const pool = require('../db');

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(systemPrompt, userContent, maxTokens = 1000) {
  const response = await fetch(process.env.OPENROUTER_BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'AI Cost Orchestrator',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  const raw = await response.json();
  if (raw.error) throw new Error(raw.error.message || 'OpenRouter error');
  return raw.choices?.[0]?.message?.content || '';
}

function parseAIJson(text) {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = match ? (match[1] || match[0]) : text;
    return JSON.parse(jsonStr.trim());
  } catch {
    return { raw: text };
  }
}

async function saveAIResult(userId, feature, inputData, result) {
  try {
    await pool.query(
      'INSERT INTO ai_results (user_id, feature, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId || null, feature, JSON.stringify(inputData), typeof result === 'string' ? result : JSON.stringify(result)]
    );
  } catch (err) {
    console.error('saveAIResult error:', err.message);
  }
}

module.exports = { callOpenRouter, parseAIJson, saveAIResult };
