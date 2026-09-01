import request from '@/utils/request';

export const getOrders = () => request({ url: '/orders', method: 'GET' });
export const createOrder = (data : any) => request({ url: '/orders', method: 'POST', data });
export const updateOrder = (id : number, data : any) => request({ url: `/orders/${id}`, method: 'PUT', data });
export const deleteOrder = (id : number) => request({ url: `/orders/${id}`, method: 'DELETE' });