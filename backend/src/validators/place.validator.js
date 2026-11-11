import { validate } from './validate.js';

const createPlaceRules = [
  (req) => {
    const { name, province, latitude, longitude } = req.body || {};
    if (!name || !name.trim()) return 'Tên địa điểm không được để trống';
    if (!province || !province.trim()) return 'Tỉnh/thành phố không được để trống';
    if (latitude === undefined || latitude === null || isNaN(parseFloat(latitude))) {
      return 'Vĩ độ (latitude) không hợp lệ';
    }
    if (longitude === undefined || longitude === null || isNaN(parseFloat(longitude))) {
      return 'Kinh độ (longitude) không hợp lệ';
    }
    return null;
  }
];

export const validateCreatePlace = validate(createPlaceRules);

export default {
  validateCreatePlace
};
