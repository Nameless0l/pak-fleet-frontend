import api from '@/lib/axios';
import { Vehicle, VehicleType, PaginatedResponse } from '@/types';

export const vehiclesService = {
  async getVehicles(params?: any): Promise<PaginatedResponse<Vehicle>> {
    const response = await api.get('/vehicles', { params });
    return response.data;
  },

  async getVehicle(id: number): Promise<Vehicle> {
    const response = await api.get(`/vehicles/${id}`);
    return response.data.data;
  },

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.post('/vehicles', data);
    return response.data.data;
  },

  async updateVehicle(id: number, data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data.data;
  },

  async deleteVehicle(id: number): Promise<void> {
    await api.delete(`/vehicles/${id}`);
  },

  async getVehicleTypes(): Promise<VehicleType[]> {
    const response = await api.get('/vehicle-types');
    return response.data;
  },
};