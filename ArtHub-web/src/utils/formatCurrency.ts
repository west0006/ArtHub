/**
 * 数字格式化为货币显示（¥1,234.56）
 */
export const formatCurrency = (value?: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || isNaN(num)) return '¥0';
  return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};