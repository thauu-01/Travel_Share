export class ApiResponse {
  static success(res, data = null, message = 'Thành công', statusCode = 200) {
    const payload = { success: true };
    if (message) payload.message = message;
    if (data !== null) payload.data = data;
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Tạo thành công') {
    return this.success(res, data, message, 201);
  }

  static paginate(res, data, pagination, message = 'Thành công') {
    return res.status(200).json({
      success: true,
      message,
      data: {
        ...data,
        pagination
      }
    });
  }

  static error(res, message = 'Có lỗi xảy ra', statusCode = 500, errors = []) {
    const payload = {
      success: false,
      message
    };
    if (errors && errors.length > 0) {
      payload.errors = errors;
    }
    return res.status(statusCode).json(payload);
  }
}

export default ApiResponse;
