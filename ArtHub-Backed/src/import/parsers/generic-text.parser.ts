import { Injectable } from '@nestjs/common';
import { OrderParser, ParsedOrderData } from './order-parser.interface';

@Injectable()
export class GenericTextParser implements OrderParser {
  name = 'generic-text';

  parse(text: string): ParsedOrderData | null {
    if (!text || text.trim().length === 0) return null;

    // 尝试提取平台名称（如果文本包含）
    const platformMatch = text.match(/平台[：:]\s*(.+)/);
    const platform = platformMatch ? platformMatch[1].trim() : 'manual';

    // 提取订单号
    const orderIdMatch = text.match(/订单号[：:]\s*([^\n]+)/);
    const platformOrderId = orderIdMatch ? orderIdMatch[1].trim() : '';

    // 提取标题（第一行或包含“标题”的行）
    let title = '';
    const titleMatch = text.match(/标题[：:]\s*([^\n]+)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      const lines = text.split('\n').filter((l) => l.trim());
      title = lines[0]?.trim() || '导入订单';
    }

    // 提取客户名
    const clientMatch = text.match(/(客户|甲方|买家)[：:]\s*([^\n]+)/);
    const clientName = clientMatch ? clientMatch[2].trim() : '';

    // 提取价格
    const priceMatch = text.match(/(价格|金额|总价)[：:]\s*(\d+\.?\d*)/);
    const price = priceMatch ? parseFloat(priceMatch[2]) : undefined;

    // 提取截止日期
    const deadlineMatch = text.match(
      /(截止|交付|截稿).{0,5}[:：]\s*([\d\-/]{8,10})/,
    );
    const deadline = deadlineMatch ? deadlineMatch[2].trim() : undefined;

    return {
      title,
      clientName,
      price,
      totalAmount: price, // 简单映射
      deadline,
      platform,
      platformOrderId,
      description: text,
      rawText: text,
    };
  }
}
