const path = require('path');
const dotenv = require('dotenv');
const { ChatMessage } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function getApiKey() {
  const key = (process.env.CHAT_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key || key === 'your-chat-api-key-here' || key === 'AIzaSyD-your-gemini-api-key-here') {
    return '';
  }
  return key;
}

function generateFallbackReply(userMessage) {
  const text = (userMessage || '').toLowerCase();

  if (text.includes('xin chào') || text.includes('chào') || text.includes('hi') || text.includes('hello')) {
    return 'Xin chào! Mình là trợ lý AI của TravelShare ✈️. Mình có thể giúp gì cho bạn về du lịch hay trải nghiệm ứng dụng?';
  }

  if (text.includes('đăng nhập') || text.includes('tài khoản') || text.includes('mật khẩu') || text.includes('đăng ký')) {
    return 'Để đăng nhập/đăng ký, bạn bấm vào nút góc phải thanh Menu trên cùng. Nếu quên mật khẩu hoặc gặp lỗi tài khoản, hãy cho mình biết nhé!';
  }

  if (text.includes('bài viết') || text.includes('đăng bài') || text.includes('viết bài') || text.includes('chia sẻ')) {
    return 'Bạn có thể đăng bài viết chia sẻ chuyến đi bằng cách nhấn vào nút "✍️ Viết bài" ở thanh menu góc trên. Bạn có thể đính kèm ảnh và đánh giá địa điểm!';
  }

  if (text.includes('bản đồ') || text.includes('khám phá') || text.includes('địa điểm')) {
    return 'Vào trang "🗺️ Khám phá" trên menu để xem trực quan danh sách địa điểm du lịch trên bản đồ tương tác của Việt Nam!';
  }

  if (text.includes('lịch trình') || text.includes('kế hoạch') || text.includes('chuyến đi')) {
    return 'TravelShare có tính năng "Lịch trình" giúp bạn tạo và quản lý kế hoạch du lịch theo từng ngày rất tiện lợi!';
  }

  if (text.includes('sapa') || text.includes('hạ long') || text.includes('hội an') || text.includes('đà nẵng') || text.includes('đà lạt') || text.includes('phú quốc')) {
    return `Rất tuyệt! Bạn có thể sử dụng thanh Tìm kiếm để tra cứu các bài viết chia sẻ kinh nghiệm du lịch thực tế tại địa điểm này từ cộng đồng TravelShare.`;
  }

  return 'Cảm ơn bạn đã nhắn tin cho TravelShare! Mình có thể tư vấn các địa điểm du lịch hot tại Việt Nam, hướng dẫn đăng bài, tạo lịch trình hoặc giải đáp thắc mắc dịch vụ.';
}

async function getAIReply(userMessage) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return generateFallbackReply(userMessage);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Bạn là trợ lý AI hỗ trợ của ứng dụng TravelShare (Nền tảng chia sẻ & khám phá du lịch Việt Nam). Hãy trả lời cực kỳ ngắn gọn, thân thiện, súc tích bằng tiếng Việt. Nếu câu hỏi không liên quan đến du lịch hoặc ứng dụng TravelShare, hãy lịch sự lái cuộc trò chuyện về chủ đề du lịch.\n\nUser hỏi: ${userMessage}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || generateFallbackReply(userMessage);
  } catch (err) {
    console.error('Gemini AI error (switching to fallback):', err.message);
    return generateFallbackReply(userMessage);
  }
}

class ChatController {
  // GET /api/chat/history
  async getHistory(req, res) {
    try {
      if (!req.user) {
        return res.json({ success: true, data: [] });
      }
      const messages = await ChatMessage.find({ user_id: req.user.id }).sort({ created_at: 1 });
      res.json({ success: true, data: messages });
    } catch (error) {
      console.error('Get chat history error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // POST /api/chat/send
  async sendMessage(req, res) {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
      }

      const aiResponseText = await getAIReply(message.trim());

      if (req.user) {
        // Save to DB for logged in user
        const userMsg = await ChatMessage.create({
          user_id: req.user.id,
          sender_type: 'user',
          message: message.trim()
        });

        const aiMsg = await ChatMessage.create({
          user_id: req.user.id,
          sender_type: 'ai',
          message: aiResponseText
        });

        return res.status(201).json({
          success: true,
          data: {
            userMessage: userMsg,
            aiMessage: aiMsg
          }
        });
      } else {
        // For guest user (not logged in)
        return res.status(200).json({
          success: true,
          data: {
            userMessage: { _id: Date.now(), sender_type: 'user', message: message.trim() },
            aiMessage: { _id: Date.now() + 1, sender_type: 'ai', message: aiResponseText }
          }
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new ChatController();
