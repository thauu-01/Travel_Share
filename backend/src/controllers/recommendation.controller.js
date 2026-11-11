import recommendationService from '../services/recommendation.service.js';
import ApiResponse from '../utils/apiResponse.js';

class RecommendationController {
  async getRecommendations(req, res, next) {
    try {
      const posts = await recommendationService.getRecommendations(req.user?.id);
      return ApiResponse.success(res, posts);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new RecommendationController();
export { controllerInstance as RecommendationController };
export default controllerInstance;
