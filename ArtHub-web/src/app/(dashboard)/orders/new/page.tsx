'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/lib/api/orders';
import { OrderData } from '@/types/api';

export default function NewOrderPage() {
  const router = useRouter();
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
    price: '',
    quantity: '1',
    description: '',
    startDate: '',
    deadline: '',
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('标题不能为空'); return; }
    setLoading(true);
    setError('');
    try {
      const priceNum = parseFloat(form.price) || 0;
      const qty = parseInt(form.quantity) || 1;
      await createOrder({
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
      router.push('/orders');
    } catch (err: any) {
      setError('创建失败：' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--main-text)] mb-6">新建订单</h1>
      <form onSubmit={handleSubmit} className="card-quark space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--main-text)] mb-1">标题 *</label>
          <input name="title" required value={form.title} onChange={handleChange} className="input-quark w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--main-text)] mb-1">客户名称</label>
            <input name="clientName" value={form.clientName} onChange={handleChange} className="input-quark w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--main-text)] mb-1">状态</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-quark w-full">
              <option value="pending">待开始</option>
              <option value="progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--main-text)] mb-1">单价 (¥)</label>
            <input name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} className="input-quark w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--main-text)] mb-1">数量</label>
            <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="input-quark w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--main-text)] mb-1">开始日期</label>
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="input-quark w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--main-text)] mb-1">截止日期</label>
            <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="input-quark w-full" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--main-text)] mb-1">描述</label>
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} className="input-quark w-full" />
        </div>
        {error && <p className="text-[var(--com-color-warn)] text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-quark">取消</button>
          <button type="submit" disabled={loading} className="btn-quark btn-quark-primary">{loading ? '创建中...' : '创建订单'}</button>
        </div>
      </form>
    </div>
  );
}