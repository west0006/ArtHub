import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ImportService } from './import.service';
import type { AuthenticatedRequest } from '../types/express';
import { OcrService } from './ocr.service';
import { Throttle } from '@nestjs/throttler';

class TextImportDto {
  rawText: string;
  platform?: string;
}

class JsonImportDto {
  title: string;
  clientName?: string;
  price?: number;
  quantity?: number;
  totalAmount?: number;
  deadline?: string;
  status?: string;
  platform: string;
  platformOrderId: string;
  platformUrl?: string;
  description?: string;
}

@Controller('import')
@UseGuards(AuthGuard('jwt'))
export class ImportController {
  constructor(
    private importService: ImportService,
    private ocrService: OcrService,
  ) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('text')
  async importFromText(
    @Req() req: AuthenticatedRequest,
    @Body() dto: TextImportDto,
  ) {
    return this.importService.importFromText(req.user.userId, dto.rawText);
  }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('json')
  async importFromJson(
    @Req() req: AuthenticatedRequest,
    @Body() dto: JsonImportDto,
  ) {
    return this.importService.importFromJson(req.user.userId, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('screenshot')
  async importFromScreenshot(
    @Req() req: AuthenticatedRequest,
    @Body() body: { imageBase64: string },
  ) {
    // 1. OCR 提取文字
    const rawText = await this.ocrService.recognizeText(body.imageBase64);
    // 2. 调用导入服务识别文字并创建订单
    return this.importService.importFromText(req.user.userId, rawText);
  }
}
