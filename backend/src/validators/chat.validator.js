import { validate } from './validate.js';

const sendMessageRules = [
  (req) => {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return 'Nội dung tin nhắn không được để trống';
    }
    return null;
  }
];

export const validateSendMessage = validate(sendMessageRules);

export default {
  validateSendMessage
};
