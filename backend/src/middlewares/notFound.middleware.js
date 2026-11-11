import ApiResponse from '../utils/apiResponse.js';

export const notFoundHandler = (req, res) => {
  return ApiResponse.error(res, 'Endpoint không tồn tại', 404);
};

export default notFoundHandler;
