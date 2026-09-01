import React from 'react';

export const Loading: React.FC<{ text?: string }> = ({ text = '加载中...' }) => (
  <div className="flex items-center justify-center h-64">
    <p className="text-[var(--com-text)]">{text}</p>
  </div>
);