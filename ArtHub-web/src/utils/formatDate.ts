import dayjs from 'dayjs';

/**
 * 格式化日期为 YYYY-MM-DD
 */
export const formatDate = (date?: string | Date, template = 'YYYY-MM-DD') => {
  if (!date) return '';
  return dayjs(date).format(template);
};

/**
 * 友好时间显示：几分钟前、几天前等
 */
export const fromNow = (date?: string | Date) => {
  if (!date) return '';
  const d = dayjs(date);
  const now = dayjs();
  const diffMinutes = now.diff(d, 'minute');
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  const diffHours = now.diff(d, 'hour');
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = now.diff(d, 'day');
  if (diffDays < 30) return `${diffDays}天前`;
  return d.format('YYYY-MM-DD');
};