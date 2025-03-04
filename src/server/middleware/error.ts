    // Handle record not found
    if (err.code === 'P2001' || err.code === 'P2018') {
      return res.status(404).json({
        error: {
          message: 'Record not found',
          code: 'NOT_FOUND',
          details: err.message
        }
      });
    }

    return res.status(400).json({
      error: {
        message: 'Database error',
        code: err.code,
        ...(config.isDevelopment && { details: err.message })
      }
    });
  }

  // Handle Stripe errors
  if (err.type?.startsWith('Stripe')) {
    return res.status(err.statusCode || 400).json({
      error: {
        message: err.message,
        code: 'PAYMENT_ERROR',
        type: err.type
      }
    });
  }

  // Handle AWS S3 errors
  if (err.name === 'S3ServiceException') {
    return res.status(500).json({
      error: {
        message: 'File storage error',
        code: 'STORAGE_ERROR',
        ...(config.isDevelopment && { details: err.message })
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Authentication token has expired',
        code: 'TOKEN_EXPIRED'
      }
    });
  }

  // Handle rate limiting errors
  if (err.name === 'TooManyRequestsError') {
    return res.status(429).json({
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: err.retryAfter
      }
    });
  }

  // Handle all other errors
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: {
      message,
      ...(config.isDevelopment && { stack: err.stack })
    }
  });
};

// Error logging middleware
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = {
    name: err.name,
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined
      },
      userId: (req as any).user?.id
    }
  };

  // Log error details
  console.error('Error details:', error);

  // If in development, also log to console
  if (config.isDevelopment) {
    console.error(err);
  }

  next(err);
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response
) => {
  res.status(404).json({
    error: {
      message: 'Resource not found',
      code: 'NOT_FOUND',
      path: req.path
    }
  });
};

// Body parser error handler
export const bodyParserErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: {
        message: 'Invalid JSON',
        code: 'INVALID_JSON'
      }
    });
  }
  next(err);
};

// Request timeout handler
export const timeoutHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setTimeout(30000, () => {
    res.status(408).json({
      error: {
        message: 'Request timeout',
        code: 'REQUEST_TIMEOUT'
      }
    });
  });
  next();
};