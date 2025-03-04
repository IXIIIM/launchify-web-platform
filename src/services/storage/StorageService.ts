import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { VerificationLevel } from '@/types/user';

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    this.bucket = process.env.AWS_S3_BUCKET!;
  }

  async uploadProfileImage(file: Buffer, userId: string): Promise<string> {
    try {
      // Process image with Sharp
      const processedImage = await sharp(file)
        .resize(1000, 1000, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 80,
          progressive: true
        })
        .toBuffer();

      const key = `profiles/${userId}/${uuidv4()}.jpg`;
      
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: processedImage,
        ContentType: 'image/jpeg',
        ACL: 'public-read',
        Metadata: {
          'user-id': userId
        }
      }));

      return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw new Error('Failed to upload profile image');
    }
  }

  async uploadCompanyLogo(file: Buffer, userId: string): Promise<string> {
    try {
      // Process logo with Sharp
      const processedImage = await sharp(file)
        .resize(500, 500, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({
          quality: 80,
          compressionLevel: 9
        })
        .toBuffer();

      const key = `logos/${userId}/${uuidv4()}.png`;
      
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: processedImage,
        ContentType: 'image/png',
        ACL: 'public-read',
        Metadata: {
          'user-id': userId
        }
      }));

      return `https://${this.bucket}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading company logo:', error);
      throw new Error('Failed to upload company logo');
    }
  }

  async uploadVerificationDocument(
    file: Buffer,
    userId: string,
    level: VerificationLevel
  ): Promise<string> {
    try {
      const key = `verification/${userId}/${level}/${uuidv4()}.pdf`;
      
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: 'application/pdf',
        ACL: 'private', // Keep verification documents private
        Metadata: {
          'user-id': userId,
          'verification-level': level
        }
      }));

      return key; // Return just the key since this will be a private file
    } catch (error) {
      console.error('Error uploading verification document:', error);
      throw new Error('Failed to upload verification document');
    }
  }

  async getSignedDocumentUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      // Generate signed URL that expires in 1 hour
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600
      });

      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate document URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async replaceProfileImage(
    file: Buffer,
    userId: string,
    oldImageUrl?: string
  ): Promise<string> {
    try {
      // Upload new image
      const newImageUrl = await this.uploadProfileImage(file, userId);

      // If there's an old image, delete it
      if (oldImageUrl) {
        const oldKey = this.getKeyFromUrl(oldImageUrl);
        await this.deleteFile(oldKey);
      }

      return newImageUrl;
    } catch (error) {
      console.error('Error replacing profile image:', error);
      throw new Error('Failed to replace profile image');
    }
  }

  async replaceCompanyLogo(
    file: Buffer,
    userId: string,
    oldLogoUrl?: string
  ): Promise<string> {
    try {
      // Upload new logo
      const newLogoUrl = await this.uploadCompanyLogo(file, userId);

      // If there's an old logo, delete it
      if (oldLogoUrl) {
        const oldKey = this.getKeyFromUrl(oldLogoUrl);
        await this.deleteFile(oldKey);
      }

      return newLogoUrl;
    } catch (error) {
      console.error('Error replacing company logo:', error);
      throw new Error('Failed to replace company logo');
    }
  }

  private getKeyFromUrl(url: string): string {
    const parts = url.split(`${this.bucket}.s3.amazonaws.com/`);
    return parts[1];
  }

  // Helper method to validate file types
  validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  // Helper method to validate file size
  validateFileSize(file: Express.Multer.File, maxSizeInBytes: number): boolean {
    return file.size <= maxSizeInBytes;
  }
}