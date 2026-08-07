// Rate limiting middleware (basic implementation)
const rateLimitStore = new Map();

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    message = 'Too many requests from this IP, please try again later',
    statusCode = 429,
  } = options;

  return (req, res, next) => {
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

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  for (const [ip, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => time > now - windowMs);
    if (validRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, validRequests);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

module.exports = rateLimiter;