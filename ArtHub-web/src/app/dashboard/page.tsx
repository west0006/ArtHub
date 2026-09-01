'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders } from '@/lib/api/orders';
import { getMyMaterials } from '@/lib/api/materials';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalOrders: 0, pending: 0, progress: 0, completed: 0, totalIncome: 0, materialCount: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ordersRes, materialsRes] = await Promise.all([getOrders(), getMyMaterials()]);
        const orders = ordersRes.data || [];
        const materials = materialsRes.data || [];
        const pending = orders.filter((o: any) => o.status === 'pending').length;
        const progress = orders.filter((o: any) => o.status === 'progress').length;
        const completed = orders.filter((o: any) => o.status === 'completed').length;
        const totalIncome = orders.filter((o: any) => o.status === 'completed').reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
        const sorted = [...orders].sort((a: any, b: any) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
        setStats({ totalOrders: orders.length, pending, progress, completed, totalIncome, materialCount: materials.length });
        setRecentOrders(sorted.slice(0, 5));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-[var(--com-text)]">加载中...</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--main-text)]">仪表盘</h1>

      {/* 统计卡片行 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总订单', value: stats.totalOrders, color: '' },
          { label: '进行中', value: stats.progress, color: 'text-[var(--com-color-cold)]' },
          { label: '待开始', value: stats.pending, color: 'text-[var(--com-color-warm)]' },
          { label: '已完成', value: stats.completed, color: 'text-[var(--main-color)]' },
        ].map((item) => (
          <div key={item.label} className="card-quark text-center">
            <p className="text-sm text-[var(--com-text)]">{item.label}</p>
            <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 收入和素材卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-quark text-center">
          <p className="text-sm text-[var(--com-text)]">累计收入</p>
          <p className="text-2xl font-bold text-[var(--main-color)] mt-1">¥{stats.totalIncome.toLocaleString()}</p>
        </div>
        <div className="card-quark text-center">
          <p className="text-sm text-[var(--com-text)]">素材总数</p>
          <p className="text-2xl font-bold mt-1">{stats.materialCount}</p>
        </div>
      </div>

      {/* 最近订单 */}
      <div className="card-quark">
        <h2 className="text-lg font-semibold mb-4 text-[var(--main-text)]">最近订单</h2>
        {recentOrders.length === 0 ? (
          <p className="text-[var(--low-color)] text-center py-4">暂无订单</p>
        ) : (
          <ul className="divide-y divide-[var(--border-top-light)]">
            {recentOrders.map((order: any) => (
              <li
                key={order.id}
                className="py-3 flex justify-between items-center cursor-pointer hover:bg-[var(--extra-light)] px-2 rounded transition-colors"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div>
                  <p className="font-medium text-[var(--main-text)]">{order.title || order.windowName || '未命名'}</p>
                  <p className="text-sm text-[var(--com-text)]">{order.clientName || '-'} · ¥{(order.totalAmount || 0).toLocaleString()}</p>
                </div>
                <span className={`status-tag ${
                  order.status === 'completed' ? 'status-completed' : order.status === 'progress' ? 'status-progress' : 'status-pending'
                }`}>
                  {order.status === 'pending' ? '待开始' : order.status === 'progress' ? '进行中' : '已完成'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}