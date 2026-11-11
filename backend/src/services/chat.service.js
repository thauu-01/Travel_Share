import chatRepository from '../repositories/chat.repository.js';
import postRepository from '../repositories/post.repository.js';
import placeRepository from '../repositories/place.repository.js';
import { getGeminiClient } from '../config/ai.config.js';

class ChatService {
  async getUserMessages(userId) {
    return await chatRepository.getUserMessages(userId);
  }

  async generateSmartFallbackReply(userMessage) {
    const text = (userMessage || '').trim().toLowerCase();

    // 1. Lời chào
    if (text.includes('xin chào') || text.includes('chào') || text === 'hi' || text === 'hello') {
      return 'Xin chào! Mình là trợ lý AI TravelShare ✈️. Bạn đang tìm địa điểm du lịch, khu nghỉ dưỡng hay cần hỗ trợ thông tin gì?';
    }

    // 2. Tài khoản & tính năng
    if (text.includes('đăng nhập') || text.includes('tài khoản') || text.includes('mật khẩu') || text.includes('đăng ký')) {
      return 'Để đăng nhập hoặc đăng ký, bạn nhấp vào nút ở góc trên bên phải thanh Menu. Nếu bạn cần đổi mật khẩu hoặc gặp lỗi tài khoản, hãy cho mình biết nhé!';
    }

    // Top Liked Posts
    if ((text.includes('bài viết') || text.includes('bài')) && (text.includes('tim') || text.includes('thích') || text.includes('like'))) {
      try {
        const { topLikes, posts } = await postRepository.getTopLikedPosts(3);
        if (posts.length > 0) {
          const items = topLikes.map((l, i) => {
            const p = posts.find(item => String(item._id) === String(l._id));
            return p ? `${i + 1}. ❤️ **${p.title}** (Tác giả: ${p.author?.full_name || 'User'} • ${l.count} lượt tim)` : null;
          }).filter(Boolean).join('\n');
          return `Dưới đây là các bài viết nhận được nhiều lượt TIM / THÍCH nhất trên TravelShare:\n\n${items}`;
        }
      } catch (e) {
        console.error('Error fetching top liked posts for chat:', e);
      }
    }

    // Top Viewed Posts
    if (text.includes('bài viết') && (text.includes('nhiều') || text.includes('xem') || text.includes('hot') || text.includes('đọc'))) {
      try {
        const topPosts = await postRepository.getTopViewedPosts(3);
        if (topPosts.length > 0) {
          const postItems = topPosts.map((p, i) => `${i + 1}. 📄 **${p.title}** (Tác giả: ${p.author?.full_name || 'User'} • ${p.view_count || 0} lượt xem)`).join('\n');
          return `Dưới đây là các bài viết có nhiều lượt xem nhất trên TravelShare hiện tại:\n\n${postItems}\n\nBạn có thể tìm đọc các bài viết này ở trang chủ hoặc thanh tìm kiếm nhé!`;
        }
      } catch (e) {
        console.error('Error fetching top viewed posts for chat:', e);
      }
    }

    // Query địa điểm du lịch
    try {
      const provinces = [
        'đà nẵng', 'hà nội', 'hồ chí minh', 'sapa', 'lào cai', 'hạ long',
        'quảng ninh', 'hội an', 'quảng nam', 'đà lạt', 'lâm đồng', 'phú quốc',
        'kiên giang', 'huế', 'thừa thiên huế', 'ninh bình', 'côn đảo', 'vũng tàu',
        'cà mau', 'sầm sơn', 'thanh hóa'
      ];
      const matched = provinces.find(p => text.includes(p));
      if (matched) {
        const places = await placeRepository.searchPlacesByKeyword(matched, 4);
        if (places.length > 0) {
          const items = places.map(p => `📍 **${p.name}** (${p.province}${p.avg_rating ? ` • ${p.avg_rating.toFixed(1)}★` : ''})`).join('\n');
          return `Gợi ý các địa điểm hấp dẫn nhất tại **${matched.toUpperCase()}** dành cho bạn:\n\n${items}\n\n👉 Bạn có thể vào mục "🗺️ Khám phá" trên Menu để xem vị trí chi tiết!`;
        }
      }

      if (text.includes('đẹp') || text.includes('ở đâu') || text.includes('gợi ý') || text.includes('du lịch')) {
        const topPlaces = await placeRepository.getTopRatedPlaces(4);
        if (topPlaces.length > 0) {
          const items = topPlaces.map(p => `🌟 **${p.name}** (${p.province}${p.avg_rating ? ` • ${p.avg_rating.toFixed(1)}★` : ''})`).join('\n');
          return `Dưới đây là các điểm đến du lịch đẹp & được yêu thích nhất trên TravelShare:\n\n${items}`;
        }
      }
    } catch (err) {
      console.error('DB query fallback error:', err);
    }

    return 'Cảm ơn bạn đã nhắn tin cho TravelShare! Bạn có thể hỏi mình về các địa điểm du lịch (ví dụ: "Địa điểm đẹp ở Đà Nẵng", "Bài viết xem nhiều nhất", "Bài viết nhiều tim nhất"), mình sẽ trả lời chi tiết cho bạn ngay!';
  }

  async getAIReply(userMessage) {
    const gemini = getGeminiClient();
    if (!gemini) {
      return await this.generateSmartFallbackReply(userMessage);
    }

    try {
      // Build context từ DB
      const topPosts = await postRepository.getTopViewedPosts(3);
      const topPlaces = await placeRepository.getTopRatedPlaces(3);

      const dbContext = `
Dữ liệu thực tế hệ thống TravelShare:
- Top bài viết xem nhiều: ${topPosts.map(p => `"${p.title}"`).join(', ')}
- Top địa điểm đánh giá cao: ${topPlaces.map(p => `"${p.name}" (${p.province})`).join(', ')}
      `;

      const systemPrompt = `Bạn là trợ lý AI thông minh của nền tảng du lịch TravelShare tại Việt Nam.
${dbContext}
Hãy trả lời câu hỏi của người dùng thân thiện, ngắn gọn và hữu ích.
Nếu câu hỏi liên quan đến du lịch Việt Nam, hãy gợi ý các địa điểm thích hợp.
Câu hỏi của người dùng: "${userMessage}"`;

      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(systemPrompt);
      const reply = result.response.text();
      return reply.trim() || await this.generateSmartFallbackReply(userMessage);
    } catch (err) {
      console.warn('Gemini chat error, fallbacking to smart reply:', err.message);
      return await this.generateSmartFallbackReply(userMessage);
    }
  }

  async processUserMessage(userId, message) {
    // 1. Lưu tin nhắn của user
    await chatRepository.create({
      user_id: userId,
      sender: 'user',
      message: message.trim()
    });

    // 2. Tạo phản hồi từ AI
    const replyText = await this.getAIReply(message);

    // 3. Lưu tin nhắn của bot
    const botMessage = await chatRepository.create({
      user_id: userId,
      sender: 'bot',
      message: replyText
    });

    return botMessage;
  }
}

const serviceInstance = new ChatService();
export { serviceInstance as ChatService };
export default serviceInstance;
