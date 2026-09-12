/**
 * Standardized API Response format.
 * All successful responses go through this class for consistency.
 */
class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {*} [data] - Response payload
   * @param {Object} [meta] - Pagination or extra metadata
   */
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (meta !== null && meta !== undefined) {
      this.meta = meta;
    }
  }

  // ===== Factory Methods =====

  static ok(message = 'Success', data = null, meta = null) {
    return new ApiResponse(200, message, data, meta);
  }

  static created(message = 'Created successfully', data = null) {
    return new ApiResponse(201, message, data);
  }

  static noContent() {
    return new ApiResponse(204, 'No content');
  }

  /**
   * Send response via Express res object.
   * @param {import('express').Response} res
   * @returns {import('express').Response}
   */
  send(res) {
    const responseBody = {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
    };
    if (this.data !== undefined) {
      responseBody.data = this.data;
    }
    if (this.meta !== undefined) {
      responseBody.meta = this.meta;
    }
    return res.status(this.statusCode).json(responseBody);
  }
}

export { ApiResponse };
