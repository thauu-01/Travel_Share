import chatService from '../services/chat.service.js';
import ApiResponse from '../utils/apiResponse.js';

class ChatController {
  async getMessages(req, res, next) {
    try {
      const messages = await chatService.getUserMessages(req.user.id);
      return ApiResponse.success(res, messages);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { message } = req.body;
      const botMessage = await chatService.processUserMessage(req.user.id, message);
      return ApiResponse.success(res, botMessage);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new ChatController();
export { controllerInstance as ChatController };
export default controllerInstance;
