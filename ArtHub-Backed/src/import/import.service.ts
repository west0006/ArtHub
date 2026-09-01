import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from '../order/order.service';
import { OrderParser, ParsedOrderData } from './parsers/order-parser.interface';
import { GenericTextParser } from './parsers/generic-text.parser';
import { MihuaShiParser } from './parsers/mihuashi.parser';
import { HuaJiaParser } from './parsers/huajia.parser';
import { LinJieParser } from './parsers/linjie.parser';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly parsers: OrderParser[];

  constructor(
    private prisma: PrismaService,
    private orderService: OrderService,
    private genericParser: GenericTextParser,
    private mihuashiParser: MihuaShiParser,
    private huajiaParser: HuaJiaParser,
    private linjieParser: LinJieParser,
  ) {
    this.parsers = [mihuashiParser, huajiaParser, linjieParser, genericParser];
  }

  /**
   * 从任意文本导入订单
   */
  async importFromText(userId: number, rawText: string) {
    for (const parser of this.parsers) {
      const data = parser.parse(rawText);
      if (data) {
        this.logger.log(`使用解析器 ${parser.name} 成功解析订单`);
        return this.createOrderFromParsed(userId, data, 'text');
      }
    }

    return this.createOrderFromParsed(
      userId,
      {
        title: '导入订单',
        platform: 'manual',
        platformOrderId: '',
        description: rawText,
        rawText,
      },
      'text',
    );
  }

  /**
   * 从结构化 JSON 导入（浏览器插件使用）
   */
  async importFromJson(userId: number, data: ParsedOrderData) {
    return this.createOrderFromParsed(userId, data, 'json');
  }

  // ---------- 私有方法 ----------
  private async createOrderFromParsed(
    userId: number,
    data: ParsedOrderData,
    importMethod: 'text' | 'json' | 'screenshot' | 'plugin',
  ) {
    // 去重检查
    if (data.platformOrderId && data.platform) {
      const existing = await this.prisma.order.findFirst({
        where: {
          userId,
          platform: data.platform,
          platformOrderId: data.platformOrderId,
        },
      });
      if (existing) {
        return { message: '订单已存在', order: existing };
      }
    }

    // 构建创建数据（遵循 Prisma.OrderCreateInput）
    const createData: Prisma.OrderCreateInput = {
      title: data.title || '导入订单',
      clientName: data.clientName || '',
      price: data.price ?? 0,
      quantity: data.quantity ?? 1,
      totalAmount: data.totalAmount ?? data.price ?? 0,
      deadline: this.formatDeadline(data.deadline), // 标准化日期
      status: 'pending',
      platform: data.platform || 'manual',
      platformOrderId: data.platformOrderId || '',
      platformUrl: data.platformUrl,
      description: data.description,
      importMethod,
      user: { connect: { id: userId } },
    };

    return this.orderService.create(createData);
  }

  /**
   * 将各种日期字符串标准化为 YYYY-MM-DD，若无效则原样返回或 undefined
   */
  private formatDeadline(deadline?: string): string | undefined {
    if (!deadline) return undefined;
    const trimmed = deadline.trim();
    // 尝试解析常见格式
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // 解析失败返回原值（可能已经是 YYYY-MM-DD）
    return trimmed;
  }
}
