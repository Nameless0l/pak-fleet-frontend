import api from '@/lib/axios';
import { Dashboard } from '@/types';

export const dashboardService = {
  async getDashboard(year?: number): Promise<Dashboard> {
    const response = await api.get('/dashboard', { params: { year } });
    return response.data;
  },
};