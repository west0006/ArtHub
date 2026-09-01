import request from '@/lib/request';

export interface DashboardSummary {
  orderCount: number;
  totalIncome: number;
  completedOrders: number;
  pendingOrders: number;
  materialCount: number;
  tutorialCount: number;
}

export const getDashboardSummary = () =>
  request.get<DashboardSummary>('/dashboard/summary');