'use client';

import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number | string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

interface TableProps<T = any> {
  columns: TableColumn<T>[];
  dataSource: T[];
  rowKey?: string | ((record: T) => string);
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (record: T) => void;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  dataSource,
  rowKey = 'id',
  loading = false,
  emptyText = '暂无数据',
  onRowClick,
  className = '',
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') return rowKey(record);
    return record[rowKey]?.toString() ?? index.toString();
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="table-quark min-w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: typeof col.width === 'number' ? `${col.width}px` : col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-[var(--com-text)]">
                加载中...
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-[var(--low-color)]">
                {emptyText}
              </td>
            </tr>
          ) : (
            dataSource.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                onClick={() => onRowClick?.(record)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render
                      ? col.render(col.dataIndex ? record[col.dataIndex] : record, record, index)
                      : col.dataIndex
                        ? record[col.dataIndex]
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}