import { Injectable } from '@nestjs/common';
import { OrderParser, ParsedOrderData } from './order-parser.interface';

@Injectable()
export class LinJieParser implements OrderParser {
  name = 'linjie';

  parse(text: string): ParsedOrderData | null {
    const match = text.match(/(\S+)\s+(\d+)\s*(元|¥)?\s*([\d\-/]{8,10})/);
    if (!match) return null;
    return {
      title: match[1].trim(),
      price: parseFloat(match[2]),
      totalAmount: parseFloat(match[2]),
      deadline: match[4].trim(),
      platform: 'linjie',
      platformOrderId: '',
      rawText: text,
    };
  }
}
