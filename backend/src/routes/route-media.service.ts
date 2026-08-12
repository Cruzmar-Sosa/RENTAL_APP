import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseStorageService } from '../common/storage/supabase-storage.service';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp') as typeof import('sharp');

@Injectable()
export class RouteMediaService {
  private readonly logger = new Logger(RouteMediaService.name);
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
   * Uploads and optimizes a route thumbnail image.
   */
  async processAndUploadThumbnail(
    routeId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }> {
    const allowedMimeTypes = ['image/webp', 'image/png', 'image/jpeg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type: "${file.mimetype}". Allowed: WEBP, PNG, JPEG.`,
      );
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File too large: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum is 5 MB.`,
      );
    }

    try {
      const optimizedBuffer = await sharp(file.buffer)
        .resize(1200, 800, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const timestamp = Date.now();
      const safeName = `route-${routeId}-${timestamp}.webp`;
      const storagePath = `routes/thumbnails/${safeName}`;

      const result = await this.storageService.uploadFile(
        this.bucket,
        storagePath,
        optimizedBuffer,
        'image/webp',
      );

      this.logger.log(`[UPLOAD] Route #${routeId} thumbnail uploaded at: ${result.path}`);
      return { url: result.publicUrl, path: result.path };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[UPLOAD] Failed to upload thumbnail for route #${routeId}: ${msg}`);
      throw new BadRequestException('Thumbnail processing failed.');
    }
  }

  /**
   * Uploads an audio guide file for a POI.
   */
  async uploadPoiAudio(
    poiId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; path: string }> {
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid audio type: "${file.mimetype}". Allowed: MP3, WAV, OGG, M4A.`,
      );
    }

    const maxBytes = 15 * 1024 * 1024; // 15 MB limit for audio
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `Audio file too large: ${(file.size / 1024 / 1024).toFixed(2)} MB. Maximum is 15 MB.`,
      );
    }

    try {
      const ext = file.originalname.split('.').pop() || 'mp3';
      const timestamp = Date.now();
      const safeName = `poi-${poiId}-${timestamp}.${ext}`;
      const storagePath = `pois/audio/${safeName}`;

      const result = await this.storageService.uploadFile(
        this.bucket,
        storagePath,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`[UPLOAD] POI #${poiId} audio guide uploaded at: ${result.path}`);
      return { url: result.publicUrl, path: result.path };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[UPLOAD] Failed to upload audio for POI #${poiId}: ${msg}`);
      throw new BadRequestException('Audio guide upload failed.');
    }
  }
}
