import request from '../request';
import type { DashboardSummary } from '@/types/api';

export const getDashboardSummary = (): Promise<DashboardSummary> =>
    request.get<DashboardSummary>('/dashboard/summary').then(res => res.data);