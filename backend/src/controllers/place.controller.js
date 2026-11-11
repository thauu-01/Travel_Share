import placeService from '../services/place.service.js';
import ApiResponse from '../utils/apiResponse.js';

class PlaceController {
  async getAll(req, res, next) {
    try {
      const result = await placeService.getAllPlaces(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getProvinces(req, res, next) {
    try {
      const provinces = await placeService.getAllProvinces();
      return ApiResponse.success(res, provinces);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const place = await placeService.getPlaceById(req.params.id);
      return ApiResponse.success(res, place);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const place = await placeService.createPlace(req.user.id, req.body, req.file);
      return ApiResponse.created(res, place, 'Tạo địa điểm thành công');
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new PlaceController();
export { controllerInstance as PlaceController };
export default controllerInstance;
