import sharp from 'sharp';

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export async function processImage(
  buffer: Buffer,
  options: ProcessImageOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 80,
    format = 'jpeg'
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Calculate dimensions while maintaining aspect ratio
    let width = metadata.width || 0;
    let height = metadata.height || 0;
    
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      
      if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      }
      
      if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }

    // Process image
    let processor = sharp(buffer)
      .resize(width, height, {
        fit: 'contain',
        withoutEnlargement: true
      });

    // Set format and quality
    if (format === 'jpeg') {
      processor = processor.jpeg({ quality });
    } else {
      processor = processor.png({ quality });
    }

    // Return processed buffer
    return await processor.toBuffer();
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
}

export async function validateImage(buffer: Buffer): Promise<void> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Validate dimensions
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image dimensions');
    }

    // Validate format
    const validFormats = ['jpeg', 'jpg', 'png'];
    if (!metadata.format || !validFormats.includes(metadata.format)) {
      throw new Error('Invalid image format. Please upload a JPG or PNG file.');
    }

    // Validate file size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('Image file size must be less than 10MB');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to validate image');
  }
}