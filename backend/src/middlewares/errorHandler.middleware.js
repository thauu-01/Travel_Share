import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Error:', err);
  }

  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors);
  }

  if (err.name === 'CastError') {
    return ApiResponse.error(res, `Định dạng tham số '${err.path}' không hợp lệ`, 400);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return ApiResponse.error(res, messages.join(', '), 400);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Lỗi hệ thống máy chủ';

  return ApiResponse.error(res, message, statusCode);
};

export default errorHandler;
