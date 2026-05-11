import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseStorageService } from '../common/storage/supabase-storage.service';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp') as typeof import('sharp');

@Injectable()
export class BikeMediaService {
  private readonly logger = new Logger(BikeMediaService.name);
  private readonly bucket: string;
  private readonly supabaseUrl: string;

  constructor(
    private storageService: SupabaseStorageService,
    private configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('SUPABASE_BUCKET') || 'bikes';
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
  }

  /**
   * Validates, optimizes and uploads a bike image.
   * Returns only the imageKey (path inside the bucket).
   * The public URL must be built from SUPABASE_URL + imageKey — never stored directly.
   */
  async processAndUploadImage(
    bikeCode: number,
    file: Express.Multer.File,
  ): Promise<{ imageKey: string }> {
    // ── 1. MIME Validation (Server-side guard) ──
    const allowedMimeTypes = ['image/webp', 'image/png', 'image/jpeg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: "${file.mimetype}". Allowed: WEBP, PNG, JPEG.`,
      );
    }

    // ── 2. Size Validation (5 MB hard limit) ──
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum is 5 MB.`,
      );
    }

    try {
      // ── 3. Optimization Pipeline ──
      // Always converts to WEBP, resizes max width to 1200px, quality 80
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // ── 4. Secure, Collision-Safe Naming ──
      // Format: bike-{code}-{timestamp}.webp
      // No original filenames, spaces, or special characters allowed.
      const timestamp = Date.now();
      const safeName = `bike-${bikeCode}-${timestamp}.webp`;
      const storagePath = `photos/${safeName}`;

      // ── 5. Upload to Supabase Storage ──
      const result = await this.storageService.uploadFile(
        this.bucket,
        storagePath,
        optimizedBuffer,
        'image/webp',
      );

      this.logger.log(`[UPLOAD] Bike #${bikeCode} image stored at: ${result.path}`);

      // Return ONLY the key — URL is built from config in the service layer
      return { imageKey: result.path };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`[UPLOAD] Failed to process image for bike #${bikeCode}: ${error.message}`);
      throw new BadRequestException('Image processing failed. Please try again.');
    }
  }

  /**
   * Deletes an image from Supabase Storage by its key.
   * Fails silently if key is missing (idempotent).
   */
  async deleteImage(imageKey: string): Promise<void> {
    if (!imageKey) return;
    try {
      await this.storageService.deleteFile(this.bucket, imageKey);
      this.logger.log(`[DELETE] Image removed: ${imageKey}`);
    } catch (error) {
      this.logger.warn(`[DELETE] Could not delete image "${imageKey}": ${error.message}`);
    }
  }

  /**
   * Builds the public Supabase Storage URL from an imageKey.
   * Use this ONLY for API response serialization — never store the URL in the DB.
   */
  buildPublicUrl(imageKey: string): string {
    if (!imageKey || !this.supabaseUrl) return '';
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${imageKey}`;
  }
}
