// 404 Not Found handler middleware
const { NotFoundError } = require('../utils/errors');

const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = notFound;