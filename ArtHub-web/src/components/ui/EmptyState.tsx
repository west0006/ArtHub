import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = '暂无数据',
  description,
  actionText,
  onAction,
}) => (
  <div className="card-quark flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="text-4xl mb-4 text-[var(--low-color)]">{icon}</div>}
    <h3 className="text-lg font-medium text-[var(--main-text)] mb-2">{title}</h3>
    {description && <p className="text-sm text-[var(--com-text)] mb-6 max-w-md">{description}</p>}
    {actionText && onAction && (
      <Button variant="primary" onClick={onAction}>
        {actionText}
      </Button>
    )}
  </div>
);