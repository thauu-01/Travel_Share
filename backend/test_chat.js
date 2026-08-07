const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

function getApiKey() {
  const key = (process.env.CHAT_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key || key === 'your-chat-api-key-here' || key === 'AIzaSyD-your-gemini-api-key-here') {
    return '';
  }
  return key;
}

function generateFallbackReply(userMessage) {
  const text = (userMessage || '').toLowerCase();

  if (text.includes('đăng nhập') || text.includes('tài khoản') || text.includes('mật khẩu')) {
    return 'Bạn có thể thử đăng nhập lại hoặc đặt lại mật khẩu. Nếu vẫn gặp lỗi, hãy cho mình biết chi tiết lỗi bạn đang thấy để mình hỗ trợ tốt hơn.';
  }

  if (text.includes('bài viết') || text.includes('đăng bài') || text.includes('post')) {
    return 'Bạn có thể kiểm tra nội dung bài viết, hình ảnh và quyền truy cập trước khi đăng lại. Nếu cần, mình có thể hướng dẫn bạn cách sửa bài viết.';
  }

  if (text.includes('địa điểm') || text.includes('điểm đến') || text.includes('du lịch')) {
    return 'TravelShare có thể giúp bạn tìm kiếm địa điểm du lịch phù hợp theo sở thích, khu vực và thời gian. Hãy cho mình biết bạn muốn đi đâu.';
  }

  return 'Cảm ơn bạn đã liên hệ! Mình có thể hỗ trợ về tài khoản, bài viết, địa điểm du lịch và cách sử dụng TravelShare. Bạn cho mình biết vấn đề bạn đang gặp phải nhé.';
}

async function getAIReply(userMessage) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return generateFallbackReply(userMessage);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.0-pro'];
    for (const m of modelsToTry) {
      try {
        console.log(`Thử model: ${m}...`);
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Địa điểm du lịch nào đẹp ở Việt Nam?");
        console.log(`✅ THÀNH CÔNG với model ${m}! Kết quả:`, result.response.text());
        return result.response.text();
      } catch (err) {
        console.log(`❌ Lỗi model ${m}:`, err.message);
      }
    }
    return generateFallbackReply(userMessage);
  } catch (err) {
    console.log('--- ERROR LOGGED (Simulated) ---');
    console.log(err.message);
    return generateFallbackReply(userMessage);
  }
}

async function runTest() {
  const question = "địa điểm nào đẹp";
  console.log("Hỏi: " + question);
  const answer = await getAIReply(question);
  console.log("Trả lời: " + answer);
}

runTest();
