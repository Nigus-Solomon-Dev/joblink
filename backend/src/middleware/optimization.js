const compression = require('compression');

const optimizationMiddleware = {
  compression: compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }),

  cacheControl: (req, res, next) => {
    const isStatic = req.path.includes('/static/') || req.path.includes('/public/');
    
    if (isStatic) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    }
    
    next();
  },

  etag: true,

  responseTime: (req, res, next) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const timeMS = Number(end - start) / 1e6;
      
      res.setHeader('X-Response-Time', `${timeMS.toFixed(2)}ms`);
    });
    
    next();
  },

  cleanInput: (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      req.body = JSON.parse(JSON.stringify(req.body));
    }
    next();
  },

  removePoweredBy: (req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
  },

  noSniff: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },

  frameProtection: (req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  },

  sslEnforcement: (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  },

  hsts: (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  },

  referrerPolicy: (req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  },

  permissionsPolicy: (req, res, next) => {
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  },

  rateLimitInfo: (req, res, next) => {
    res.setHeader('X-RateLimit-Limit', req.rateLimit?.limit || 100);
    res.setHeader('X-RateLimit-Remaining', req.rateLimit?.remaining || 0);
    res.setHeader('X-RateLimit-Reset', req.rateLimit?.resetTime ? Math.ceil(req.rateLimit.resetTime.diff(new Date()) / 1000) : 0);
    next();
  }
};

module.exports = optimizationMiddleware;