// src/server/services/image/ImageOptimizationService.ts
import sharp from 'sharp';
import { S3 } from 'aws-sdk';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  aspectRatio?: number;
}

interface OptimizedImage {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export class ImageOptimizationService {
  private readonly bucket: string;
  private readonly defaultOptions: ImageOptimizationOptions = {
    width: 1000,
    height: 1000,
    quality: 80,
    format: 'jpeg'
  };

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET!;
  }

  async optimizeAndStore(
    imageBuffer: Buffer,
    userId: string,
    purpose: 'profile' | 'document' | 'logo',
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    try {
      // Merge with default options
      const finalOptions = { ...this.defaultOptions, ...options };

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();

      // Prepare optimization pipeline
      let pipeline = sharp(imageBuffer);

      // Resize maintaining aspect ratio if specified
      if (finalOptions.width || finalOptions.height) {
        pipeline = pipeline.resize(finalOptions.width, finalOptions.height, {
          fit: 'cover',
          position: 'center'
        });
      }

      // Force aspect ratio if specified
      if (finalOptions.aspectRatio) {
        const targetHeight = Math.round(finalOptions.width! * finalOptions.aspectRatio);
        pipeline = pipeline.resize(finalOptions.width, targetHeight, {
          fit: 'cover',
          position: 'center'
        });
      }

      // Apply format-specific optimizations
      switch (finalOptions.format) {
        case 'jpeg':
          pipeline = pipeline.jpeg({
            quality: finalOptions.quality,
            progressive: true,
            chromaSubsampling: '4:2:0'
          });
          break;
        case 'png':
          pipeline = pipeline.png({
            progressive: true,
            compressionLevel: 9,
            palette: true
          });
          break;
        case 'webp':
          pipeline = pipeline.webp({
            quality: finalOptions.quality,
            lossless: false
          });
          break;
      }

      // Process image
      const optimizedBuffer = await pipeline.toBuffer();

      // Generate unique filename
      const filename = `${purpose}/${userId}/${uuidv4()}.${finalOptions.format}`;

      // Upload to S3
      await s3.upload({
        Bucket: this.bucket,
        Key: filename,
        Body: optimizedBuffer,
        ContentType: `image/${finalOptions.format}`,
        ACL: 'public-read'
      }).promise();

      // Store metadata in database
      const image = await prisma.image.create({
        data: {
          userId,
          purpose,
          filename,
          format: finalOptions.format!,
          width: metadata.width!,
          height: metadata.height!,
          size: optimizedBuffer.length,
          url: `https://${this.bucket}.s3.amazonaws.com/${filename}`
        }
      });

      return {
        url: image.url,
        width: image.width,
        height: image.height,
        size: image.size,
        format: image.format
      };
    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error('Failed to optimize and store image');
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    try {
      const image = await prisma.image.findUnique({
        where: { id: imageId }
      });

      if (!image) throw new Error('Image not found');

      // Delete from S3
      await s3.deleteObject({
        Bucket: this.bucket,
        Key: image.filename
      }).promise();

      // Delete from database
      await prisma.image.delete({
        where: { id: imageId }
      });
    } catch (error) {
      console.error('Image deletion error:', error);
      throw new Error('Failed to delete image');
    }
  }

  async generateVariants(
    imageId: string,
    variants: ImageOptimizationOptions[]
  ): Promise<OptimizedImage[]> {
    try {
      const image = await prisma.image.findUnique({
        where: { id: imageId }
      });

      if (!image) throw new Error('Image not found');

      // Download original image
      const response = await s3.getObject({
        Bucket: this.bucket,
        Key: image.filename
      }).promise();

      const results = await Promise.all(
        variants.map(options =>
          this.optimizeAndStore(
            response.Body as Buffer,
            image.userId,
            image.purpose,
            options
          )
        )
      );

      return results;
    } catch (error) {
      console.error('Variant generation error:', error);
      throw new Error('Failed to generate image variants');
    }
  }

  async validateImage(imageBuffer: Buffer): Promise<void> {
    try {
      // Check file size
      if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB
        throw new Error('Image exceeds maximum file size of 10MB');
      }

      // Validate image format and dimensions
      const metadata = await sharp(imageBuffer).metadata();
      
      if (!['jpeg', 'jpg', 'png'].includes(metadata.format || '')) {
        throw new Error('Invalid image format. Only JPEG and PNG are supported');
      }

      if (metadata.width! > 5000 || metadata.height! > 5000) {
        throw new Error('Image dimensions exceed maximum of 5000x5000 pixels');
      }

      // Scan for potential malware/malicious content
      // Note: Implement more thorough security scanning if needed
      if (metadata.space === 'cmyk') {
        throw new Error('CMYK color space not supported');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid image file');
    }
  }
}