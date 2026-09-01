'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getOrders, deleteOrder, updateOrder } from '@/lib/api/orders';
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import type { OrderData } from '@/types/api';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOrders();
      setOrders(res.data as OrderData[]);
    } catch (err: any) {
      setError('加载订单失败：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => filter === 'all' ? true : order.status === filter);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredOrders.map((o) => o.id) : []);
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确定删除选中的 ${selectedIds.length} 个订单？`)) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteOrder(id)));
      setSelectedIds([]);
      fetchOrders();
    } catch (err: any) {
      alert('批量删除失败：' + (err.response?.data?.message || err.message));
    }
  };

  const handleBatchStatus = async (newStatus: string) => {
    if (!confirm(`确定将选中的 ${selectedIds.length} 个订单状态改为 ${newStatus}？`)) return;
    try {
      await Promise.all(selectedIds.map((id) => updateOrder(id, { status: newStatus as OrderData['status']})));
      setSelectedIds([]);
      fetchOrders();
    } catch (err: any) {
      alert('批量修改失败：' + (err.response?.data?.message || err.message));
    }
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('订单列表');
    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: '标题', key: 'title', width: 30 },
      { header: '客户', key: 'client', width: 15 },
      { header: '金额', key: 'amount', width: 12 },
      { header: '状态', key: 'status', width: 12 },
      { header: '开始日期', key: 'startDate', width: 15 },
      { header: '截止日期', key: 'deadline', width: 15 },
    ];
    orders.forEach((order) => {
      sheet.addRow({
        id: order.id,
        title: order.title || order.windowName,
        client: order.clientName || '',
        amount: order.totalAmount,
        status: order.status === 'pending' ? '待开始' : order.status === 'progress' ? '进行中' : '已完成',
        startDate: order.startDate ? new Date(order.startDate).toLocaleDateString() : '',
        deadline: order.deadline ? new Date(order.deadline).toLocaleDateString() : '',
      });
    });
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), '订单列表.xlsx');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">加载中...</p></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchOrders} className="btn-quark btn-quark-primary">重试</button>
      </div>
    );
  }

  return (
    <div>
      {/* 操作栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`btn-quark text-sm ${filter === status ? 'btn-quark-primary' : ''}`}
            >
              {status === 'all' ? '全部' : status === 'pending' ? '待开始' : status === 'progress' ? '进行中' : '已完成'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-quark btn-quark-primary text-sm">导出 Excel</button>
          <button onClick={() => router.push('/orders/new')} className="btn-quark btn-quark-primary text-sm">新建订单</button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div className="card-quark mb-4 flex items-center gap-4 flex-wrap" style={{ padding: 'var(--title-content)' }}>
          <span className="text-sm text-[var(--com-text)]">已选 {selectedIds.length} 项</span>
          <button onClick={() => handleBatchStatus('progress')} className="btn-quark btn-quark-primary text-sm">标记进行中</button>
          <button onClick={() => handleBatchStatus('completed')} className="btn-quark btn-quark-primary text-sm">标记已完成</button>
          <button onClick={handleBatchDelete} className="btn-quark btn-quark-danger text-sm">批量删除</button>
          <button onClick={() => setSelectedIds([])} className="text-sm text-[var(--low-color)] hover:underline">取消选择</button>
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="table-quark min-w-[800px]">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                  className="rounded"
                />
              </th>
              <th>标题</th>
              <th>客户</th>
              <th>金额</th>
              <th>日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[var(--low-color)]">
                  暂无订单，点击“新建订单”开始
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => handleSelectOne(order.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="font-medium">{order.title || order.windowName || '未命名'}</td>
                  <td>{order.clientName || '-'}</td>
                  <td>¥{(order.totalAmount || 0).toLocaleString()}</td>
                  <td className="text-xs text-[var(--com-text)]">
                    {order.startDate ? new Date(order.startDate).toLocaleDateString() : '-'} ~ {order.deadline ? new Date(order.deadline).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <span className={`status-tag ${
                      order.status === 'completed' ? 'status-completed' :
                      order.status === 'progress' ? 'status-progress' : 'status-pending'
                    }`}>
                      {order.status === 'pending' ? '待开始' : order.status === 'progress' ? '进行中' : '已完成'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2 text-sm">
                      <button onClick={() => router.push(`/orders/${order.id}`)} className="text-[var(--main-color)] hover:underline">查看</button>
                      <button onClick={() => router.push(`/orders/edit/${order.id}`)} className="text-[var(--com-color-cold)] hover:underline">编辑</button>
                      <button onClick={async () => { await deleteOrder(order.id); fetchOrders(); }} className="text-[var(--com-color-warn)] hover:underline">删除</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}