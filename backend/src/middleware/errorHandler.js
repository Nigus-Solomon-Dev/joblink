// Global error handler middleware
const { NODE_ENV } = require('../config/env');
const { AppError } = require('../utils/errors');
const ApiResponse = require('../utils/apiResponse');
const Logger = require('../utils/logger');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
  const response = ApiResponse.error(err.message, err.statusCode, {
    error: err,
    stack: err.stack,
  });
  res.status(err.statusCode).json(response);
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    const response = ApiResponse.error(err.message, err.statusCode);
    res.status(err.statusCode).json(response);
  } else {
    Logger.error('ERROR 💥', err);
    const response = ApiResponse.error('Something went very wrong!', 500);
    res.status(500).json(response);
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

module.exports = globalErrorHandler;