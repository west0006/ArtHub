import request from '../request';
import type { OrderData } from '@/types/api';

export const getOrders = (): Promise<OrderData[]> =>
    request.get<OrderData[]>('/orders').then(res => res.data);

export const getOrderById = (id: number): Promise<OrderData> =>
    request.get<OrderData>(`/orders/${id}`).then(res => res.data);

export const createOrder = (data: Partial<OrderData>): Promise<OrderData> =>
    request.post<OrderData>('/orders', data).then(res => res.data);

export const updateOrder = (id: number, data: Partial<OrderData>): Promise<OrderData> =>
    request.put<OrderData>(`/orders/${id}`, data).then(res => res.data);

export const deleteOrder = (id: number): Promise<void> =>
    request.delete(`/orders/${id}`).then(res => res.data);