import React from 'react';

interface StatusTagProps {
  status: 'pending' | 'progress' | 'completed';
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待开始', className: 'status-pending' },
  progress: { label: '进行中', className: 'status-progress' },
  completed: { label: '已完成', className: 'status-completed' },
};

export const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const config = statusMap[status] || statusMap.pending;
  return <span className={`status-tag ${config.className}`}>{config.label}</span>;
};