export const formatCurrency = (value?: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num === undefined || isNaN(num)) return '¥0';
    return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};