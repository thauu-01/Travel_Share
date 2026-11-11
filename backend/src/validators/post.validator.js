import { validate } from './validate.js';

const createPostRules = [
  (req) => {
    const { title, content } = req.body || {};
    if (!title || !title.trim()) {
      return 'Tiêu đề bài viết không được để trống';
    }
    if (!content || !content.trim()) {
      return 'Nội dung bài viết không được để trống';
    }
    return null;
  }
];

const updatePostRules = [
  (req) => {
    const { title, content } = req.body || {};
    if (title !== undefined && !title.trim()) {
      return 'Tiêu đề không được để trống';
    }
    if (content !== undefined && !content.trim()) {
      return 'Nội dung không được để trống';
    }
    return null;
  }
];

export const validateCreatePost = validate(createPostRules);
export const validateUpdatePost = validate(updatePostRules);

export default {
  validateCreatePost,
  validateUpdatePost
};
