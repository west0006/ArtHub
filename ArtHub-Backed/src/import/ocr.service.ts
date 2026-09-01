import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Tesseract from 'tesseract.js';
import type { RecognizeResult } from 'tesseract.js';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private client: any = null;
  private clientInitPromise: Promise<void> | null = null;
  private readonly preferLocal: boolean;
  private readonly localConfidenceThreshold: number;

  constructor(private readonly configService: ConfigService) {
    this.preferLocal =
      configService.get<string>('OCR_PREFER_LOCAL', 'true') === 'true';
    this.localConfidenceThreshold = parseInt(
      configService.get<string>('OCR_LOCAL_CONFIDENCE_THRESHOLD', '70'),
      10,
    );
  }

  /**
   * 懒加载腾讯云 OCR 客户端
   */
  private async getTencentClient(): Promise<any> {
    if (this.client) return this.client;

    // 避免并发重复初始化
    if (!this.clientInitPromise) {
      this.clientInitPromise = this.initTencentClient();
    }
    await this.clientInitPromise;
    return this.client;
  }

  private async initTencentClient(): Promise<void> {
    const secretId = this.configService.get<string>('TENCENT_SECRET_ID');
    const secretKey = this.configService.get<string>('TENCENT_SECRET_KEY');
    if (!secretId || !secretKey) {
      throw new Error('腾讯云 OCR 未配置');
    }

    try {
      const tencentcloud = await import('tencentcloud-sdk-nodejs');
      const OcrClient = tencentcloud.ocr.v20181119.Client;
      const clientConfig = {
        credential: { secretId, secretKey },
        region: this.configService.get('TENCENT_REGION', 'ap-beijing'),
        profile: {
          httpProfile: { endpoint: 'ocr.tencentcloudapi.com' },
        },
      };
      this.client = new OcrClient(clientConfig);
      this.logger.log('腾讯云 OCR 客户端初始化成功');
    } catch (err) {
      this.logger.error('腾讯云 OCR SDK 加载失败', err);
      throw err;
    }
  }

  /**
   * 识别图片文字（本地优先降级）
   */
  async recognizeText(imageBase64: string): Promise<string> {
    if (this.preferLocal) {
      try {
        const text = await this.localRecognize(imageBase64);
        if (text) return text;
      } catch (err) {
        this.logger.warn('本地 OCR 失败，尝试云服务', err);
      }
    }

    // 云 OCR（懒加载）
    const client = await this.getTencentClient();
    return this.cloudRecognize(imageBase64, client);
  }

  /**
   * 本地 Tesseract 识别
   */
  private async localRecognize(imageBase64: string): Promise<string | null> {
    const buffer = Buffer.from(imageBase64, 'base64');
    const { data }: RecognizeResult = await Tesseract.recognize(
      buffer,
      'chi_sim+eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.verbose(
              `本地 OCR 进度: ${Math.round((m.progress || 0) * 100)}%`,
            );
          }
        },
      },
    );

    const fullText = (data.text || '').trim();
    if (!fullText) return null;

    if (data.confidence >= this.localConfidenceThreshold) {
      this.logger.log(`本地 OCR 成功，置信度 ${data.confidence}%`);
      return fullText;
    }

    this.logger.warn(
      `本地 OCR 结果不可信: 置信度 ${data.confidence}% < ${this.localConfidenceThreshold}%，文本长度 ${fullText.length}`,
    );
    return null;
  }

  /**
   * 云 OCR 调用
   */
  private async cloudRecognize(
    imageBase64: string,
    client: any,
  ): Promise<string> {
    const params = { ImageBase64: imageBase64 };
    const response = await client.GeneralBasicOCR(params);
    const texts: string[] =
      (response.TextDetections as Array<{ DetectedText: string }>)?.map(
        (item) => item.DetectedText,
      ) ?? [];
    return texts.join('\n');
  }
}
