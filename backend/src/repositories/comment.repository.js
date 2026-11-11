import BaseRepository from './base.repository.js';
import { Comment } from '../models/index.js';

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  async getCommentsByPostId(postId) {
    return await this.model.find({ post_id: parseInt(postId), parent_id: null })
      .populate('user', 'id full_name avatar_url')
      .populate({
        path: 'replies',
        populate: { path: 'user', select: 'id full_name avatar_url' },
        options: { sort: { created_at: 1 } }
      })
      .sort({ created_at: -1 });
  }

  async getCommentWithAuthor(commentId) {
    return await this.model.findById(commentId)
      .populate('user', 'id full_name avatar_url');
  }
}

const repoInstance = new CommentRepository();
export { repoInstance as CommentRepository };
export default repoInstance;
