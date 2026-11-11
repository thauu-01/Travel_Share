import { validate } from './validate.js';

const createCommentRules = [
  (req) => {
    const { content } = req.body || {};
    if (!content || !content.trim()) {
      return 'Nội dung bình luận không được để trống';
    }
    return null;
  }
];

export const validateCreateComment = validate(createCommentRules);

export default {
  validateCreateComment
};
