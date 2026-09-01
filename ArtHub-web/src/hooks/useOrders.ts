'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrders, deleteOrder, updateOrder, createOrder } from '@/lib/api/orders';
import type { OrderData } from '@/types/api';

export function useOrders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrders();
      setOrders(res.data as OrderData[]);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const addOrder = async (data: Partial<OrderData>) => {
    await createOrder(data);
    await fetchOrders();
  };

  const editOrder = async (id: number, data: Partial<OrderData>) => {
    await updateOrder(id, data);
    await fetchOrders();
  };

  const removeOrder = async (id: number) => {
    await deleteOrder(id);
    await fetchOrders();
  };

  return { orders, loading, error, fetchOrders, addOrder, editOrder, removeOrder };
}