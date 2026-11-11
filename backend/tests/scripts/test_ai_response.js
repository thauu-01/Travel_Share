const Groq = require('groq-sdk');
require('dotenv').config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `Bạn là chuyên gia du lịch Việt Nam. Trả về JSON hợp lệ ĐÚNG FORMAT (không thêm text khác):
{"title":"...","description":"...","days":[{"day_number":1,"note":"...","places":[{"name":"...","note":"..."}]}]}`;

const userPrompt = `Lịch trình 2 ngày tại Phú Quốc. Ngân sách: tiết kiệm. Phong cách: tổng hợp. Địa điểm:\n- Bãi Sao\n- Bãi Dài\n- Vinpearl`;

groq.chat.completions.create({
  model: 'groq/compound-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.7,
  max_tokens: 1500
}).then(r => {
  const content = r.choices[0].message.content;
  console.log('=== RAW RESPONSE ===');
  console.log(content);
  console.log('\n=== PARSED ===');
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    const parsed = JSON.parse(match[0]);
    console.log(JSON.stringify(parsed, null, 2));
    // Check places have name
    parsed.days?.forEach(d => {
      d.places?.forEach(p => {
        console.log('Place name:', p.name, '| note:', p.note?.substring(0, 50));
      });
    });
  }
}).catch(e => console.error('ERROR:', e.message));
