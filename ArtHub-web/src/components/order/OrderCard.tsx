import React from 'react';
import { useRouter } from 'next/navigation';
import { StatusTag } from '../ui/StatusTag';
import type { OrderData } from '@/types/api';

interface OrderCardProps {
  order: OrderData;
  onDelete?: (id: number) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onDelete }) => {
  const router = useRouter();
  return (
    <div className="card-quark p-4 flex flex-col gap-2 hover:bg-[var(--main-color-light)] transition-colors">
      <div className="flex justify-between items-start">
        <h3
          className="font-medium text-[var(--main-text)] cursor-pointer hover:underline"
          onClick={() => router.push(`/orders/${order.id}`)}
        >
          {order.title || order.windowName || '未命名订单'}
        </h3>
        <StatusTag status={order.status} />
      </div>
      <div className="text-sm text-[var(--com-text)] flex justify-between">
        <span>{order.clientName || '未知客户'}</span>
        <span className="font-medium text-[var(--main-color)]">¥{(order.totalAmount || 0).toLocaleString()}</span>
      </div>
      <div className="text-xs text-[var(--low-color)]">
        {order.startDate || '-'} ~ {order.deadline || '-'}
      </div>
      {onDelete && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push(`/orders/edit/${order.id}`)}
            className="text-xs text-[var(--com-color-cold)] hover:underline"
          >
            编辑
          </button>
          <button
            onClick={() => onDelete(order.id)}
            className="text-xs text-[var(--com-color-warn)] hover:underline"
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
};