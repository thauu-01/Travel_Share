import BaseRepository from './base.repository.js';
import { ChatMessage } from '../models/index.js';

class ChatRepository extends BaseRepository {
  constructor() {
    super(ChatMessage);
  }

  async getUserMessages(userId, limit = 50) {
    return await this.model.find({ user_id: userId })
      .sort({ created_at: 1 })
      .limit(limit);
  }

  async getSupportConversations() {
    // Lấy tin nhắn cuối cùng của mỗi user để liệt kê conversations
    return await this.model.aggregate([
      { $match: { is_support: true } },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$user_id',
          lastMessage: { $first: '$message' },
          lastCreatedAt: { $first: '$created_at' },
          sender: { $first: '$sender' }
        }
      },
      { $sort: { lastCreatedAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
    ]);
  }
}

const repoInstance = new ChatRepository();
export { repoInstance as ChatRepository };
export default repoInstance;
