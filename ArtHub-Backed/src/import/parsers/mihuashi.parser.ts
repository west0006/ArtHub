import { Injectable } from '@nestjs/common';
import { OrderParser, ParsedOrderData } from './order-parser.interface';

@Injectable()
export class MihuaShiParser implements OrderParser {
  name = 'mihuashi';

  parse(text: string): ParsedOrderData | null {
    // 米画师订单详情常见格式（示例）
    const regex =
      /【(.+?)】\s*客户[：:]\s*(\S+)\s*金额[：:]\s*¥([\d.]+)\s*截稿[：:]\s*([\d\-]+)/;
    const match = text.match(regex);
    if (!match) return null;

    return {
      title: match[1].trim(),
      clientName: match[2].trim(),
      price: parseFloat(match[3]),
      totalAmount: parseFloat(match[3]),
      deadline: match[4].trim(),
      platform: 'mihuashi',
      platformOrderId: '', // 若有提取规则可补充
      description: text,
      rawText: text,
    };
  }
}
