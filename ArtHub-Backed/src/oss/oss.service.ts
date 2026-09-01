import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import * as path from 'path';

@Injectable()
export class OssService {
  private readonly client: OSS;
  private readonly customDomain: string;
  private readonly logger = new Logger(OssService.name);

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const accessKeyId = configService.get<string>('OSS_ACCESS_KEY_ID');
    const accessKeySecret = configService.get<string>('OSS_ACCESS_KEY_SECRET');
    const bucket = configService.get<string>('OSS_BUCKET');
    const endpoint = configService.get<string>('OSS_ENDPOINT');

    if (!accessKeyId || !accessKeySecret || !bucket) {
      this.logger.error('OSS 配置不完整，请检查环境变量');
    }

    this.client = new OSS({
      accessKeyId: accessKeyId || '',
      accessKeySecret: accessKeySecret || '',
      bucket: bucket || '',
      endpoint: endpoint || '',
    });

    this.customDomain = configService.get<string>('OSS_CUSTOM_DOMAIN') || '';
  }

  async upload(localPath: string, ossPath: string): Promise<string> {
    try {
      const result = await this.client.put(ossPath, localPath);
      return this.customDomain ? `${this.customDomain}/${ossPath}` : result.url;
    } catch (error) {
      this.logger.error('OSS upload failed', error);
      throw error;
    }
  }

  async delete(ossPath: string): Promise<void> {
    try {
      await this.client.delete(ossPath);
    } catch (error) {
      this.logger.error('OSS delete failed', error);
    }
  }

  generatePath(originalName: string, prefix = 'materials'): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const ext = path.extname(originalName) || '.png';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    return `${prefix}/${year}/${month}/${filename}`;
  }
}
