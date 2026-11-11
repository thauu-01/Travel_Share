export class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Dữ liệu không hợp lệ', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Vui lòng đăng nhập để tiếp tục') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Bạn không có quyền thực hiện hành động này') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Tài nguyên không tồn tại') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Dữ liệu đã tồn tại hoặc xảy ra xung đột') {
    return new ApiError(409, message);
  }

  static internal(message = 'Lỗi hệ thống máy chủ', errors = []) {
    return new ApiError(500, message, errors);
  }
}

export default ApiError;
