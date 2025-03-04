import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import multer from 'multer';
import { ValidationError } from './error';
import { config } from '../config/environment';

// Create multer instance for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.features.maxFileSize // Default 10MB
  },
  fileFilter: (req, file, cb) => {
    // Check mime type
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Schema validation middleware
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid request data', error.errors));
      } else {
        next(error);
      }
    }
  };
};

// Query parameters validation middleware
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid query parameters', error.errors));
      } else {
        next(error);
      }
    }
  };
};

// Route parameters validation middleware
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid route parameters', error.errors));
      } else {
        next(error);
      }
    }
  };
};

// File upload validation middleware
export const validateFile = (fieldName: string, options?: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploader = upload.single(fieldName);

    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('File too large', [{
            field: fieldName,
            message: `File size must not exceed ${options?.maxSize || config.features.maxFileSize / (1024 * 1024)}MB`
          }]));
        }
      }

      if (err) {
        return next(new ValidationError('File upload error', [{
          field: fieldName,
          message: err.message
        }]));
      }

      if (options?.required && !req.file) {
        return next(new ValidationError('File required', [{
          field: fieldName,
          message: 'File is required'
        }]));
      }

      if (req.file && options?.allowedTypes && !options.allowedTypes.includes(req.file.mimetype)) {
        return next(new ValidationError('Invalid file type', [{
          field: fieldName,
          message: `File must be one of: ${options.allowedTypes.join(', ')}`
        }]));
      }

      next();
    });
  };
};

// Multiple files upload validation middleware
export const validateFiles = (fieldName: string, options?: {
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploader = upload.array(fieldName, options?.maxFiles);

    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ValidationError('File too large', [{
            field: fieldName,
            message: `File size must not exceed ${options?.maxSize || config.features.maxFileSize / (1024 * 1024)}MB`
          }]));
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ValidationError('Too many files', [{
            field: fieldName,
            message: `Maximum ${options?.maxFiles} files allowed`
          }]));
        }
      }

      if (err) {
        return next(new ValidationError('File upload error', [{
          field: fieldName,
          message: err.message
        }]));
      }

      const files = req.files as Express.Multer.File[];

      if (options?.required && (!files || files.length === 0)) {
        return next(new ValidationError('Files required', [{
          field: fieldName,
          message: 'At least one file is required'
        }]));
      }

      if (files && options?.allowedTypes) {
        const invalidFiles = files.filter(
          file => !options.allowedTypes?.includes(file.mimetype)
        );

        if (invalidFiles.length > 0) {
          return next(new ValidationError('Invalid file type(s)', invalidFiles.map(file => ({
            field: fieldName,
            message: `Invalid file type: ${file.originalname}`
          }))));
        }
      }

      next();
    });
  };
};

// Data sanitization middleware
export const sanitize = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body[field]) {
        if (typeof req.body[field] === 'string') {
          // Remove HTML tags
          req.body[field] = req.body[field].replace(/<[^>]*>/g, '');
          // Trim whitespace
          req.body[field] = req.body[field].trim();
        }
      }
    });
    next();
  };
};