import request from '@/lib/request';
import type { OrderData } from '@/types/api';

export const getOrders = () =>
  request.get<OrderData[]>('/orders');

export const getOrderById = (id: number) =>
  request.get<OrderData>(`/orders/${id}`);

export const createOrder = (data: Partial<OrderData>) =>
  request.post<OrderData>('/orders', data);

export const updateOrder = (id: number, data: Partial<OrderData>) =>
  request.put<OrderData>(`/orders/${id}`, data);

export const deleteOrder = (id: number) =>
  request.delete(`/orders/${id}`);