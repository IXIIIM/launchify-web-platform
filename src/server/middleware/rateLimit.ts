  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req: Request) => {
    return `api-rate-limit:${req.ip}`;
  },
  skip: (req: Request) => {
    // Skip rate limiting for certain paths
    const skipPaths = [
      '/api/health',
      '/api/webhooks/stripe'
    ];
    return skipPaths.includes(req.path);
  }
});

// Rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  keyGenerator: (req: Request) => {
    return `auth-rate-limit:${req.ip}:${req.body.email}`;
  }
});

// Rate limiter for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 uploads per hour
  keyGenerator: (req: Request) => {
    return `upload-rate-limit:${req.ip}`;
  }
});

// Dynamic rate limiter based on subscription tier
export const subscriptionBasedRateLimit = () => {
  const tierLimits = {
    Basic: 100,
    Chrome: 200,
    Bronze: 500,
    Silver: 1000,
    Gold: 2000,
    Platinum: Infinity
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return next();
    }

    const tier = (req as any).user.subscriptionTier;
    const limit = tierLimits[tier as keyof typeof tierLimits];

    const rateLimiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: limit,
      keyGenerator: (req: Request) => {
        return `subscription-rate-limit:${(req as any).user.id}`;
      },
      skip: () => limit === Infinity
    });

    return rateLimiter(req, res, next);
  };
};

// Rate limiter for websocket connections
export const websocketRateLimit = () => {
  const connections = new Map<string, { count: number; timestamp: number }>();
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_CONNECTIONS = 10;

  return (ip: string): boolean => {
    const now = Date.now();
    const data = connections.get(ip);

    if (!data || now - data.timestamp >= WINDOW_MS) {
      connections.set(ip, { count: 1, timestamp: now });
      return true;
    }

    if (data.count >= MAX_CONNECTIONS) {
      return false;
    }

    data.count++;
    return true;
  };
};

// Clean up expired rate limit data periodically
setInterval(async () => {
  try {
    const keys = await redis.keys('rate-limit:*');
    const now = Date.now();

    for (const key of keys) {
      const timestamp = await redis.hget(key, 'timestamp');
      if (timestamp && now - parseInt(timestamp) >= defaultOptions.windowMs) {
        await redis.del(key);
      }
    }
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}, 60 * 60 * 1000); // Run every hour