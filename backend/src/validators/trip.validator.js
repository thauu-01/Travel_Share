import { validate } from './validate.js';

const createTripRules = [
  (req) => {
    const { title } = req.body || {};
    if (!title || !title.trim()) {
      return 'Tiêu đề lịch trình không được để trống';
    }
    return null;
  }
];

const addPlaceToDayRules = [
  (req) => {
    const { place_id } = req.body || {};
    if (!place_id) {
      return 'Vui lòng chọn địa điểm du lịch';
    }
    return null;
  }
];

export const validateCreateTrip = validate(createTripRules);
export const validateAddPlaceToDay = validate(addPlaceToDayRules);

export default {
  validateCreateTrip,
  validateAddPlaceToDay
};
