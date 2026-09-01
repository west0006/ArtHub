'use client';

import { useState, useMemo } from 'react';

export function usePagination<T>(items: T[], pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}