import api from '@/lib/axios';
import { SparePart, PaginatedResponse } from '@/types';

export const sparePartsService = {
  async getSpareParts(params?: any): Promise<PaginatedResponse<SparePart>> {
    const response = await api.get('/spare-parts', { params });
    return response.data;
  },

  async createSparePart(data: Partial<SparePart>): Promise<SparePart> {
    const response = await api.post('/spare-parts', data);
    return response.data.data;
  },

  async updateSparePart(id: number, data: Partial<SparePart>): Promise<SparePart> {
    const response = await api.put(`/spare-parts/${id}`, data);
    return response.data.data;
  },

  async updateStock(id: number, quantity: number, operation: 'add' | 'remove'): Promise<SparePart> {
    const response = await api.post(`/spare-parts/${id}/update-stock`, { quantity, operation });
    return response.data.data;
  },

  async getLowStockAlerts(): Promise<SparePart[]> {
    const response = await api.get('/spare-parts/alerts/low-stock');
    return response.data.data;
  },
};