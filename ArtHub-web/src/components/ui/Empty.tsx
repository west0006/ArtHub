import React from 'react';

interface EmptyProps {
  message?: string;
  action?: React.ReactNode;
}

export const Empty: React.FC<EmptyProps> = ({ message = '暂无数据', action }) => (
  <div className="card-quark text-center py-12 text-[var(--low-color)]">
    <p className="mb-2">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);