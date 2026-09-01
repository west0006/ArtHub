'use client';

import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize = 10,
  onChange,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  // 计算显示的页码范围
  const getPageNumbers = () => {
    const pages: (number | 'dots-left' | 'dots-right')[] = [];
    const delta = 2;
    const left = Math.max(2, current - delta);
    const right = Math.min(totalPages - 1, current + delta);

    pages.push(1);
    if (left > 2) pages.push('dots-left');
    for (let i = left; i <= right; i++) {
      pages.push(i);
    }
    if (right < totalPages - 1) pages.push('dots-right');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="default"
        size="sm"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        上一页
      </Button>
      {getPageNumbers().map((page, index) => {
        if (typeof page === 'string') {
          return (
            <span key={page + index} className="px-2 text-[var(--low-color)]">
              ...
            </span>
          );
        }
        return (
          <Button
            key={page}
            variant={page === current ? 'primary' : 'default'}
            size="sm"
            onClick={() => onChange(page)}
          >
            {page}
          </Button>
        );
      })}
      <Button
        variant="default"
        size="sm"
        disabled={current >= totalPages}
        onClick={() => onChange(current + 1)}
      >
        下一页
      </Button>
      <span className="text-xs text-[var(--com-text)] ml-2">
        共 {total} 条
      </span>
    </div>
  );
};