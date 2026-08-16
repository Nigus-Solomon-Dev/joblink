// Rate limiting middleware (in-memory implementation)
const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 600,
    message = 'Too many requests from this IP, please try again later',
    statusCode = 429,
    skip = () => false,
  } = options;

  const rateLimitStore = new Map();

  return (req, res, next) => {
    if (skip(req)) return next();

    const ip = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }

    const requests = rateLimitStore.get(ip).filter(time => time > windowStart);
    rateLimitStore.set(ip, requests);

    if (requests.length >= maxRequests) {
      const retryAfter = Math.ceil((requests[0] + windowMs - now) / 1000);
      res.set('Retry-After', retryAfter);
      return res.status(statusCode).json({
        success: false,
        message,
        retryAfter,
      });
    }

    requests.push(now);
    next();
  };
};

module.exports = rateLimiter;