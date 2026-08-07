// Standardized API response format
class ApiResponse {
  constructor(statusCode, data = null, message = null, meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.data = data;
    this.message = message;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = 'Success', statusCode = 200, meta = null) {
    return new ApiResponse(statusCode, data, message, meta);
  }

  static created(data, message = 'Resource created successfully', meta = null) {
    return new ApiResponse(201, data, message, meta);
  }

  static noContent(message = 'Success') {
    return new ApiResponse(204, null, message);
  }

  static error(message, statusCode = 500, data = null) {
    return new ApiResponse(statusCode, data, message);
  }
}

module.exports = ApiResponse;