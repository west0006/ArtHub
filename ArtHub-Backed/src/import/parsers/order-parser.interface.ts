export interface ParsedOrderData {
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
  rawText?: string; // 原始文本，方便调试
}

export interface OrderParser {
  /** 解析器名称 */
  name: string;
  /** 尝试解析，若无法识别则返回 null */
  parse(text: string): ParsedOrderData | null;
}
