import api from '@/lib/axios';
import { MaintenanceOperation, MaintenanceType, PaginatedResponse } from '@/types';

export const maintenanceService = {
  async getOperations(params?: any): Promise<PaginatedResponse<MaintenanceOperation>> {
    const response = await api.get('/maintenance-operations', { params });
    console.log('Maintenance operations response:', response.data);
    return response.data;
  },

  async getOperation(id: number): Promise<MaintenanceOperation> {
    const response = await api.get(`/maintenance-operations/${id}`);
    return response.data.data;
  },

  async createOperation(data: any): Promise<MaintenanceOperation> {
    const response = await api.post('/maintenance-operations', data);
    return response.data.data;
  },

  async getPlannedOperations(): Promise<any[]> {
    const response = await api.get('/maintenance-operations/planned');
    console.log('Maintenance operations response:', response.data);
    return response.data.data;
  },

  async getMaintenanceTypes(): Promise<MaintenanceType[]> {
    const response = await api.get('/maintenance-types');
    return response.data;
  },

  async getPendingValidations(params?: any): Promise<PaginatedResponse<MaintenanceOperation>> {
    const response = await api.get('/validations/pending', { params });
    return response.data;
  },

  async validateOperation(id: number, data: { status: 'validated' | 'rejected'; comment?: string }): Promise<any> {
    const response = await api.post(`/maintenance-operations/${id}/validate`, data);
    return response.data;
  },
};