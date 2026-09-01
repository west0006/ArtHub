'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrders, deleteOrder } from '@/lib/api/orders';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getOrders();
        setOrder((res.data as any[]).find((o) => o.id === orderId) || null);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    })();
  }, [orderId]);

  const handleDelete = async () => {
    if (!confirm('确定删除？')) return;
    await deleteOrder(orderId);
    router.push('/orders');
  };

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-[var(--com-text)]">加载中...</p></div>;
  if (!order) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-red-500">订单不存在</p>
      <button onClick={() => router.back()} className="btn-quark">返回</button>
    </div>
  );

  const statusMap: any = { pending: '待开始', progress: '进行中', completed: '已完成' };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-[var(--main-text)]">{order.title || order.windowName}</h1>
        <span className={`status-tag ${order.status === 'completed' ? 'status-completed' : order.status === 'progress' ? 'status-progress' : 'status-pending'}`}>{statusMap[order.status]}</span>
      </div>

      <div className="card-quark">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-[var(--com-text)]">客户：</span><span className="font-medium">{order.clientName || '未知'}</span></div>
          <div><span className="text-[var(--com-text)]">金额：</span><span className="font-medium text-[var(--main-color)]">¥{(order.totalAmount || 0).toLocaleString()}</span></div>
          <div><span className="text-[var(--com-text)]">开始日期：</span>{order.startDate ? new Date(order.startDate).toLocaleString() : '未设置'}</div>
          <div><span className="text-[var(--com-text)]">截止日期：</span>{order.deadline ? new Date(order.deadline).toLocaleString() : '未设置'}</div>
        </div>
        {order.description && (
          <div className="mt-4">
            <h3 className="font-medium text-[var(--main-text)] mb-1">描述</h3>
            <p className="text-sm text-[var(--com-text)] whitespace-pre-wrap bg-[var(--extra-light)] p-3 rounded">{order.description}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.push(`/orders/edit/${orderId}`)} className="btn-quark btn-quark-primary">编辑订单</button>
        <button onClick={handleDelete} className="btn-quark btn-quark-danger">删除订单</button>
        <button onClick={() => router.back()} className="btn-quark">返回列表</button>
      </div>
    </div>
  );
}