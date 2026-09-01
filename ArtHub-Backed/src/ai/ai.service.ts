import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly pythonBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.pythonBaseUrl = this.configService.get<string>(
      'PYTHON_AGENT_URL',
      'http://127.0.0.1:8000',
    );
  }

  /** 聊天 */
  async chat(message: string, isSave = true): Promise<{ reply: string }> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(`${this.pythonBaseUrl}/minichat`, {
          message,
          is_save: isSave,
        }),
      );
      return data;
    } catch (error) {
      return {
        reply: '你好！我是AI助手（当前为离线模式，Python服务未启动）。',
      };
    }
  }

  /** 图像分析 */
  async analyzeImage(imageBase64: string, prompt?: string) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.pythonBaseUrl}/analyze-image`, {
        image: imageBase64,
        prompt: prompt || '',
      }),
    );
    return data;
  }
}
