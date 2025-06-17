import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { User } from '@/types';

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const response = await api.post('/login', credentials);
    const { token, user } = response.data;
    
    Cookies.set('token', token, { expires: 7 });
    return user;
  },

  async logout() {
    await api.post('/logout');
    Cookies.remove('token');
  },

  async getUser(): Promise<User> {
    const response = await api.get('/user');
    return response.data;
  },
};