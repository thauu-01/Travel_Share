const Groq = require('groq-sdk');
require('dotenv').config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const models = ['groq/compound', 'groq/compound-mini', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

async function testModel(model) {
  try {
    const r = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Return only valid JSON' },
        { role: 'user', content: 'Create a 1-day trip to Da Nang. Return JSON: {"title":"...","days":[{"day_number":1,"note":"...","places":[{"name":"...","note":"..."}]}]}' }
      ],
      temperature: 0.5,
      max_tokens: 600
    });
    console.log(`✅ ${model}: OK - ${r.choices[0].message.content.substring(0, 80)}`);
  } catch(e) {
    console.log(`❌ ${model}: ${e.status} - ${e.message?.substring(0, 100)}`);
  }
}

(async () => {
  for (const m of models) {
    await testModel(m);
  }
})();
