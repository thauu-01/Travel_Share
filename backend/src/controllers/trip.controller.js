import tripService from '../services/trip.service.js';
import ApiResponse from '../utils/apiResponse.js';

class TripController {
  async getAll(req, res, next) {
    try {
      const trips = await tripService.getAllUserTrips(req.user.id);
      return ApiResponse.success(res, trips);
    } catch (err) {
      next(err);
    }
  }

  async getMyTrips(req, res, next) {
    try {
      const trips = await tripService.getMyTripsBrief(req.user.id);
      return ApiResponse.success(res, trips);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const trip = await tripService.getTripById(req.params.id, req.user);
      return ApiResponse.success(res, trip);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const trip = await tripService.createTrip(req.user.id, req.body);
      return ApiResponse.created(res, trip, 'Tạo lịch trình thành công');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
      return ApiResponse.success(res, trip, 'Cập nhật lịch trình thành công');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await tripService.deleteTrip(req.params.id, req.user.id, req.user.role);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async addDay(req, res, next) {
    try {
      const day = await tripService.addDay(req.params.id, req.user.id, req.body);
      return ApiResponse.created(res, day, 'Thêm ngày thành công');
    } catch (err) {
      next(err);
    }
  }

  async addPlaceToDay(req, res, next) {
    try {
      const tripPlace = await tripService.addPlaceToDay(req.params.dayId, req.user.id, req.body);
      return ApiResponse.created(res, tripPlace, 'Đã thêm địa điểm vào lịch trình');
    } catch (err) {
      next(err);
    }
  }

  async removePlaceFromDay(req, res, next) {
    try {
      const result = await tripService.removePlaceFromDay(req.params.placeId, req.user.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async autoGenerateAI(req, res, next) {
    try {
      const result = await tripService.generateAITrip(req.user.id, req.body);
      return ApiResponse.success(res, result, 'Sinh lịch trình bằng AI thành công');
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new TripController();
export { controllerInstance as TripController };
export default controllerInstance;
