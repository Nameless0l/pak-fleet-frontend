import api from '@/lib/axios';
import { User, PaginatedResponse } from '@/types';

export const usersService = {
  async getUsers(params?: any): Promise<PaginatedResponse<User>> {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async createUser(data: any): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
};