const { ChatMessage } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyD-your-gemini-api-key-here') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

async function getAIReply(userMessage) {
  try {
    if (!genAI) {
      return 'Chào bạn! Hiện tại Admin đang vắng mặt. Tôi là trợ lý ảo nhưng cấu hình API Key của tôi chưa hoàn tất. Bạn vui lòng quay lại sau hoặc để lại tin nhắn nhé!';
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Bạn là trợ lý AI hỗ trợ của TravelShare - nền tảng chia sẻ trải nghiệm du lịch Việt Nam. Hãy trả lời cực kỳ ngắn gọn, thân thiện bằng tiếng Việt. Nếu câu hỏi không liên quan đến du lịch Việt Nam hoặc ứng dụng TravelShare, hãy lịch sự từ chối và hướng dẫn người dùng hỏi đúng chủ đề.\n\nUser hỏi: ${userMessage}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini AI generation error:', err);
    return 'Xin lỗi, tôi đang gặp sự cố kết nối AI. Vui lòng thử lại sau hoặc liên hệ Admin qua email nhé!';
  }
}

class ChatController {
  // GET /api/chat/history
  async getHistory(req, res) {
    try {
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

      // 1. Save user message
      const userMsg = await ChatMessage.create({
        user_id: req.user.id,
        sender_type: 'user',
        message: message.trim()
      });

      // 2. Call Gemini AI helper to generate response
      const aiResponseText = await getAIReply(message.trim());

      // 3. Save AI message
      const aiMsg = await ChatMessage.create({
        user_id: req.user.id,
        sender_type: 'ai',
        message: aiResponseText
      });

      res.status(201).json({
        success: true,
        data: {
          userMessage: userMsg,
          aiMessage: aiMsg
        }
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new ChatController();
