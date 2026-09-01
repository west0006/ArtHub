import { Injectable } from '@nestjs/common';
import { OrderParser, ParsedOrderData } from './order-parser.interface';

@Injectable()
export class HuaJiaParser implements OrderParser {
  name = 'huajia';

  parse(text: string): ParsedOrderData | null {
    // 画加常见订单格式：标题、预算金额、需求描述、截止时间
    const match = text.match(
      /【(.+?)】\s*预算[：:]\s*(\d+)\s*描述[：:]\s*(.+?)(?:截稿[：:]|$)/s,
    );
    if (!match) return null;

    const deadlineMatch = text.match(/截稿[：:]\s*([\d\-/]+)/);
    return {
      title: match[1].trim(),
      price: parseFloat(match[2]),
      totalAmount: parseFloat(match[2]),
      description: match[3].trim(),
      deadline: deadlineMatch ? deadlineMatch[1].trim() : undefined,
      platform: 'huajia',
      platformOrderId: '',
      rawText: text,
    };
  }
}
