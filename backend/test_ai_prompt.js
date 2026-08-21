const Groq = require('groq-sdk');
require('dotenv').config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const systemPrompt = `Bạn là chuyên gia du lịch Việt Nam. Tạo lịch trình du lịch bằng TIẾNG VIỆT chuẩn.
QUY TẮC BẮT BUỘC:
1. Tên địa điểm ("name") PHẢI là tiếng Việt thuần túy, ngắn gọn (ví dụ: "Thác Bạc", "Đỉnh Fansipan", "Núi Hàm Rồng", "Bản Cát Cát"). TUYỆT ĐỐI KHÔNG dùng tiếng Anh hoặc kèm mở ngoặc tiếng Anh.
2. Ưu tiên sử dụng chính xác tên các địa điểm trong danh sách gợi ý của hệ thống:
- Sapa
- Đỉnh Fansipan
- Thác Bạc
3. Trả về đúng JSON format:
{"title":"...","description":"...","days":[{"day_number":1,"note":"...","places":[{"name":"...","note":"..."}]}]}`;

const userPrompt = 'Lịch trình 2 ngày tại Sapa. Ngân sách: tiết kiệm. Phong cách: khám phá.';

groq.chat.completions.create({
  model: 'groq/compound-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  temperature: 0.5,
  max_tokens: 1200
}).then(r => {
  const match = r.choices[0].message.content.match(/\{[\s\S]*\}/);
  if (match) {
    const data = JSON.parse(match[0]);
    console.log('Title:', data.title);
    data.days.forEach(d => {
      console.log('Day', d.day_number, ':', d.note);
      d.places.forEach(p => console.log('  -> Place Name:', p.name, '| note:', p.note?.substring(0, 40)));
    });
  }
}).catch(e => console.error(e));
