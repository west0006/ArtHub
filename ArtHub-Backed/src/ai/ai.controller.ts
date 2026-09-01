import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt')) // 需要登录才能调用 AI 服务
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** 对话 */
  @Post('chat')
  async chat(@Body() body: { message: string; is_save?: boolean }) {
    const reply = await this.aiService.chat(body.message, body.is_save);
    return { reply };
  }

  /** 图像分析 */
  @Post('analyze-image')
  async analyzeImage(@Body() body: { image: string; prompt?: string }) {
    const reply = await this.aiService.analyzeImage(body.image, body.prompt);
    return { reply };
  }
}
