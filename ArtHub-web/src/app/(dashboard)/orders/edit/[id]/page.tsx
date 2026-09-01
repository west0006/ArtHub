'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, updateOrder } from '@/lib/api/orders';
import { OrderData } from '@/types/api';

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [form, setForm] = useState<{
  title: string;
  clientName: string;
  price: string;
  quantity: string;
  description: string;
  startDate: string;
  deadline: string;
  status: OrderData['status'];
}>({
  title: '',
  clientName: '',
  price: '0',
  quantity: '1',
  description: '',
  startDate: '',
  deadline: '',
  status: 'pending',  // 此时自动推断为字面量类型
});
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await getOrderById(orderId);
      const found = res.data;
      if (!found) {
        setNotFound(true);
        return;
      }
      setForm({
        title: found.title || found.windowName || '',
        clientName: found.clientName || '',
        price: String(found.price || 0),
        quantity: String(found.quantity || 1),
        description: found.description || '',
        startDate: found.startDate ? found.startDate.substring(0, 10) : '',
        deadline: found.deadline ? found.deadline.substring(0, 10) : '',
        status: found.status || 'pending',
      });
    } catch (err: any) {
      setError('加载订单失败：' + (err.response?.data?.message || err.message));
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('标题不能为空');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const priceNum = parseFloat(form.price) || 0;
      const qty = parseInt(form.quantity) || 1;
      await updateOrder(orderId, {
        title: form.title.trim(),
        clientName: form.clientName.trim(),
        price: priceNum,
        quantity: qty,
        totalAmount: priceNum * qty,
        description: form.description,
        startDate: form.startDate || undefined,
        deadline: form.deadline || undefined,
        status: form.status as OrderData['status'],
      });
      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      setError('保存失败：' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center items-center h-64"><p className="text-gray-500">加载中...</p></div>;
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">订单不存在</p>
        <button onClick={() => router.back()} className="text-green-600 hover:underline">返回</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">编辑订单</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">标题 *</label>
          <input name="title" required value={form.title} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">客户名称</label>
            <input name="clientName" value={form.clientName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2">
              <option value="pending">待开始</option>
              <option value="progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">单价 (¥)</label>
            <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">数量</label>
            <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">开始日期</label>
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">截止日期</label>
            <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">描述</label>
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">取消</button>
          <button type="submit" disabled={submitting} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400">
            {submitting ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
}