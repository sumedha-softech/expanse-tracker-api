class ApiError extends Error {
  constructor(statusCode, message,error) {
    super(message);
    this.statusCode = statusCode;
     this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
     this.error = error;
     this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = ApiError;
