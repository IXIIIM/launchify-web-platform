// src/server/controllers/image.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ImageOptimizationService } from '../services/image/ImageOptimizationService';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const imageService = new ImageOptimizationService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only images are allowed'));
      return;
    }
    cb(null, true);
  }
}).single('image');

interface AuthRequest extends Request {
  user: any;
}

export const uploadImage = async (req: AuthRequest, res: Response) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ message: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file provided' });
      }

      const { purpose } = req.body;
      if (!['profile', 'document', 'logo'].includes(purpose)) {
        return res.status(400).json({ message: 'Invalid image purpose' });
      }

      // Validate image
      await imageService.validateImage(req.file.buffer);

      // Optimize and store image
      const optimizedImage = await imageService.optimizeAndStore(
        req.file.buffer,
        req.user.id,
        purpose,
        {
          width: 1000,
          height: purpose === 'profile' ? 1000 : undefined,
          quality: 80
        }
      );

      // Generate variants if needed
      if (purpose === 'profile') {
        await imageService.generateVariants(optimizedImage.url, [
          { width: 150, height: 150, quality: 70 }, // thumbnail
          { width: 500, height: 500, quality: 75 }  // medium
        ]);
      }

      // Update user profile with new image URL
      if (purpose === 'profile' || purpose === 'logo') {
        const updateField = purpose === 'profile' ? 'photo' : 'logo';
        if (req.user.userType === 'entrepreneur') {
          await prisma.entrepreneurProfile.update({
            where: { userId: req.user.id },
            data: { [updateField]: optimizedImage.url }
          });
        } else {
          await prisma.funderProfile.update({
            where: { userId: req.user.id },
            data: { [updateField]: optimizedImage.url }
          });
        }
      }

      res.json(optimizedImage);
    } catch (error) {
      console.error('Image processing error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Error processing image' 
      });
    }
  });
};

export const getImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { size = 'original' } = req.query;

    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        variants: true
      }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (size === 'original') {
      return res.json(image);
    }

    const variant = image.variants.find(v => v.purpose === size);
    if (!variant) {
      return res.status(404).json({ message: 'Image variant not found' });
    }

    res.json(variant);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Error fetching image' });
  }
};

export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const image = await prisma.image.findUnique({
      where: { id }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Verify ownership
    if (image.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this image' });
    }

    await imageService.deleteImage(id);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
};

export const updateImageMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { metadata } = req.body;

    const image = await prisma.image.findUnique({
      where: { id }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Verify ownership
    if (image.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this image' });
    }

    const updatedImage = await prisma.image.update({
      where: { id },
      data: { metadata }
    });

    res.json(updatedImage);
  } catch (error) {
    console.error('Error updating image metadata:', error);
    res.status(500).json({ message: 'Error updating image metadata' });
  }
};

export const listUserImages = async (req: AuthRequest, res: Response) => {
  try {
    const { purpose, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId: req.user.id,
      ...(purpose ? { purpose } : {})
    };

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        include: {
          variants: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
      }),
      prisma.image.count({ where })
    ]);

    res.json({
      images,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ message: 'Error listing images' });
  }
};