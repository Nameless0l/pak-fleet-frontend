import api from '@/lib/axios';

export const reportsService = {
  async exportReport(format: 'csv' | 'excel' | 'pdf', params?: any): Promise<Blob> {
    const response = await api.get('/reports/export', {
      params: { format, ...params },
      responseType: 'blob',
    });
    return response.data;
  },

  async getAnnualSummary(year: number): Promise<any> {
    const response = await api.get(`/reports/annual-summary/${year}`);
    return response.data;
  },
};
