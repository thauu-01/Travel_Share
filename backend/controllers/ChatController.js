const path = require('path');
const dotenv = require('dotenv');
const { ChatMessage, Post, Place, Category, Like } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function getApiKey() {
  const key = (process.env.CHAT_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!key || key === 'your-chat-api-key-here' || key === 'AIzaSyD-your-gemini-api-key-here') {
    return '';
  }
  return key;
}

async function generateSmartFallbackReply(userMessage) {
  const text = (userMessage || '').trim().toLowerCase();

  // 1. Check greeting
  if (text.includes('xin chào') || text.includes('chào') || text === 'hi' || text === 'hello') {
    return 'Xin chào! Mình là trợ lý AI TravelShare ✈️. Bạn đang tìm địa điểm du lịch, khu nghỉ dưỡng hay cần hỗ trợ thông tin gì?';
  }

  // 2. Check accounts & app features
  if (text.includes('đăng nhập') || text.includes('tài khoản') || text.includes('mật khẩu') || text.includes('đăng ký')) {
    return 'Để đăng nhập hoặc đăng ký, bạn nhấp vào nút ở góc trên bên phải thanh Menu. Nếu bạn cần đổi mật khẩu hoặc gặp lỗi tài khoản, hãy cho mình biết nhé!';
  }

  // Top Liked Posts
  if ((text.includes('bài viết') || text.includes('bài')) && (text.includes('tim') || text.includes('thích') || text.includes('like'))) {
    try {
      const topLikes = await Like.aggregate([
        { $group: { _id: '$post_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]);
      const postIds = topLikes.map(l => l._id);
      const posts = await Post.find({ _id: { $in: postIds }, is_hidden: { $ne: true } }).populate('author', 'full_name');

      if (posts.length > 0) {
        const items = topLikes.map((l, i) => {
          const p = posts.find(item => String(item._id) === String(l._id));
          return p ? `${i + 1}. ❤️ **${p.title}** (Tác giả: ${p.author?.full_name || 'User'} • ${l.count} lượt tim)` : null;
        }).filter(Boolean).join('\n');

        return `Dưới đây là các bài viết nhận được nhiều lượt TIM / THÍCH nhất trên TravelShare:\n\n${items}`;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Top Viewed Posts
  if (text.includes('bài viết') && (text.includes('nhiều') || text.includes('xem') || text.includes('hot') || text.includes('đọc'))) {
    try {
      const topPosts = await Post.find({ is_hidden: { $ne: true }, status: 'published' })
        .sort({ view_count: -1, created_at: -1 })
        .limit(3)
        .populate('author', 'full_name');

      if (topPosts.length > 0) {
        const postItems = topPosts.map((p, i) => `${i + 1}. 📄 **${p.title}** (Tác giả: ${p.author?.full_name || 'User'} • ${p.view_count || 0} lượt xem)`).join('\n');
        return `Dưới đây là các bài viết có nhiều lượt xem nhất trên TravelShare hiện tại:\n\n${postItems}\n\nBạn có thể tìm đọc các bài viết này ở trang chủ hoặc thanh tìm kiếm nhé!`;
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (text.includes('bài viết') || text.includes('đăng bài') || text.includes('viết bài') || text.includes('chia sẻ')) {
    return 'Bạn có thể đăng bài viết chia sẻ trải nghiệm chuyến đi bằng cách bấm nút "✍️ Đăng bài" trên thanh Menu. Bạn có thể đính kèm ảnh và gắn thẻ địa điểm du lịch!';
  }

  if (text.includes('lịch trình') || text.includes('kế hoạch') || text.includes('chuyến đi')) {
    return 'Chức năng "Lịch trình" trên Menu giúp bạn tạo và sắp xếp danh sách địa điểm du lịch theo từng ngày rất tiện lợi!';
  }

  // 3. Smart Database Query for Locations & Provinces
  try {
    const listProvinces = [
      'đà nẵng', 'hà nội', 'hồ chí minh', 'sapa', 'lào cai', 'hạ long', 
      'quảng ninh', 'hội an', 'quảng nam', 'đà lạt', 'lâm đồng', 'phú quốc', 
      'kiên giang', 'huế', 'thừa thiên huế', 'ninh bình', 'côn đảo', 'vũng tàu', 
      'cà mau', 'sầm sơn', 'thanh hóa'
    ];
    const matchedProvince = listProvinces.find(p => text.includes(p));

    if (matchedProvince) {
      const dbPlaces = await Place.find({
        $or: [
          { province: { $regex: matchedProvince, $options: 'i' } },
          { name: { $regex: matchedProvince, $options: 'i' } },
          { address: { $regex: matchedProvince, $options: 'i' } }
        ]
      }).limit(4);

      if (dbPlaces.length > 0) {
        const placeItems = dbPlaces.map(p => `📍 **${p.name}** (${p.province}${p.avg_rating ? ` • ${p.avg_rating.toFixed(1)}★` : ''})`).join('\n');
        return `Gợi ý các địa điểm hấp dẫn nhất tại **${matchedProvince.toUpperCase()}** dành cho bạn:\n\n${placeItems}\n\n👉 Bạn có thể vào mục "🗺️ Khám phá" trên thanh Menu để xem vị trí chi tiết trên bản đồ tương tác!`;
      }
    }

    // 4. Resort / Vacation intent
    if (text.includes('nghỉ dưỡng') || text.includes('nghỉ') || text.includes('resort') || text.includes('biển') || text.includes('thư giãn')) {
      const resortPlaces = await Place.find({
        $or: [
          { name: { $regex: 'biển|nghỉ dưỡng|côn đảo|phú quốc|nha trang|sầm sơn|mỹ khê', $options: 'i' } },
          { province: { $regex: 'vũng tàu|đà nẵng|quảng nam|lâm đồng|kiên giang|bà rịa', $options: 'i' } }
        ]
      }).limit(4);

      if (resortPlaces.length > 0) {
        const items = resortPlaces.map(p => `🏖️ **${p.name}** (${p.province}${p.avg_rating ? ` • ${p.avg_rating.toFixed(1)}★` : ''})`).join('\n');
        return `Gợi ý các điểm du lịch & nghỉ dưỡng tuyệt vời hàng đầu:\n\n${items}\n\nBạn ưu tiên chọn nghỉ dưỡng biển hay đồi núi mát mẻ?`;
      }
    }

    // 5. General "đẹp", "địa điểm đẹp", "ở đâu", "gợi ý" intent
    if (text.includes('đẹp') || text.includes('ở đâu') || text.includes('gợi ý') || text.includes('nào') || text.includes('du lịch')) {
      const topPlaces = await Place.find().sort({ avg_rating: -1, view_count: -1 }).limit(4);
      if (topPlaces.length > 0) {
        const items = topPlaces.map(p => `🌟 **${p.name}** (${p.province}${p.avg_rating ? ` • ${p.avg_rating.toFixed(1)}★` : ''})`).join('\n');
        return `Dưới đây là các điểm đến du lịch đẹp & được yêu thích nhất trên TravelShare:\n\n${items}\n\nBạn muốn tìm hiểu thêm thông tin về địa điểm nào?`;
      }
    }
  } catch (err) {
    console.error('DB query fallback error:', err);
  }

  return 'Cảm ơn bạn đã nhắn tin cho TravelShare! Bạn có thể hỏi mình về các địa điểm du lịch (ví dụ: "Địa điểm đẹp ở Đà Nẵng", "Bài viết xem nhiều nhất", "Bài viết nhiều tim nhất"), mình sẽ trả lời chi tiết cho bạn ngay!';
}

async function getAIReply(userMessage) {
  // Build real-time database context for AI prompt
  let dbContext = '';
  try {
    // Top Viewed Posts
    const topPosts = await Post.find({ is_hidden: { $ne: true }, status: 'published' })
      .sort({ view_count: -1, created_at: -1 })
      .limit(5)
      .populate('author', 'full_name')
      .populate('place', 'name province');

    // Top Liked Posts (Aggregation)
    const topLikesAgg = await Like.aggregate([
      { $group: { _id: '$post_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const topLikedPostIds = topLikesAgg.map(l => l._id);
    const topLikedPosts = await Post.find({ _id: { $in: topLikedPostIds }, is_hidden: { $ne: true } })
      .populate('author', 'full_name');

    // Top Places
    const topPlaces = await Place.find()
      .sort({ avg_rating: -1, view_count: -1 })
      .limit(5);

    if (topPosts.length > 0) {
      dbContext += `\n📌 Danh sách bài viết nhiều LƯỢT XEM nhất trên TravelShare:\n` +
        topPosts.map((p, i) => `${i + 1}. "${p.title}" (Tác giả: ${p.author?.full_name || 'User'}, Lượt xem: ${p.view_count || 0}${p.place ? `, Địa điểm: ${p.place.name}` : ''})`).join('\n');
    }

    if (topLikesAgg.length > 0) {
      const likedItems = topLikesAgg.map((l, i) => {
        const p = topLikedPosts.find(item => String(item._id) === String(l._id));
        return p ? `${i + 1}. "${p.title}" (Tác giả: ${p.author?.full_name || 'User'}, Lượt tim/thích: ${l.count}❤️)` : null;
      }).filter(Boolean);

      if (likedItems.length > 0) {
        dbContext += `\n\n❤️ Danh sách bài viết nhiều LƯỢT TIM / LƯỢT THÍCH nhất trên TravelShare:\n` + likedItems.join('\n');
      }
    }

    if (topPlaces.length > 0) {
      dbContext += `\n\n📍 Danh sách địa điểm du lịch hot nhất trên TravelShare:\n` +
        topPlaces.map((p, i) => `${i + 1}. ${p.name} (${p.province}, Đánh giá: ${p.avg_rating ? p.avg_rating.toFixed(1) : 5.0}★)`).join('\n');
    }
  } catch (err) {
    console.error('Error building DB context for AI:', err);
  }

  const prompt = `Bạn là trợ lý AI thông minh của ứng dụng TravelShare (Nền tảng chia sẻ & khám phá du lịch Việt Nam).
Dưới đây là DỮ LIỆU THỰC TẾ TRONG DATABASE của hệ thống TravelShare:
${dbContext}

Người dùng hỏi: "${userMessage}"
Hãy sử dụng dữ liệu thực tế từ Database trên (nếu câu hỏi liên quan tới bài viết, lượt xem, lượt tim, lượt thích, địa điểm hot,...) để trả lời chính xác, ngắn gọn, thân thiện bằng tiếng Việt.`;

  // 1. Try Groq API if key is provided
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [
            { role: 'system', content: `Bạn là trợ lý AI du lịch Việt Nam của TravelShare.\nDỮ LIỆU DATABASE HỆ THỐNG THỰC TẾ:\n${dbContext}` },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (groqErr) {
      console.error('Groq AI error:', groqErr.message);
    }
  }

  // 2. Try Gemini API if key is provided
  const apiKey = getApiKey();
  if (apiKey) {
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response?.text()?.trim();
        if (text) return text;
      } catch (err) {
        console.error(`Gemini AI (${modelName}) error:`, err.message);
      }
    }
  }

  // 3. Smart Database Intent Search Fallback
  return await generateSmartFallbackReply(userMessage);
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
