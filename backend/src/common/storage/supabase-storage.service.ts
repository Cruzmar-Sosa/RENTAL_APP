import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStorageService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase credentials missing in environment variables');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  async uploadFile(
    bucket: string,
    path: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<{ publicUrl: string; path: string }> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Error uploading file to Supabase: ${error.message}`);
      throw error;
    }

    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      publicUrl: urlData.publicUrl,
      path: data.path,
    };
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);

    if (error) {
      this.logger.error(`Error deleting file from Supabase: ${error.message}`);
      throw error;
    }
  }
}
