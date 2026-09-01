export interface OrderData {
  id: number;
  title?: string;
  windowName?: string;
  clientName?: string;
  price?: number;
  quantity?: number;
  totalAmount?: number;
  startDate?: string;
  deadline?: string;
  status: 'pending' | 'progress' | 'completed';
  description?: string;
  settingInfo?: string;
  platform?: string;
  platformOrderId?: string;
  platformUrl?: string;
  importMethod?: string;
  createTime?: string;
}

export interface MaterialData {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  tags?: string;
  colorPalette?: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  copyright?: string;
  fileSize?: number;
  dimension?: string;
  createTime: string;
}