import axios from 'axios';
import { User, Pet, PendingUser } from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.get<User[]>('/users', {
      params: { email, password },
    });
    return response.data[0];
  },
  register: async (userData: Omit<User, 'id' | 'isAdmin' | 'isApproved'>) => {
    const response = await api.post<PendingUser>('/pendingUsers', userData);
    return response.data;
  },
};

export const petApi = {
  getPets: async () => {
    const response = await api.get<Pet[]>('/pets');
    return response.data;
  },
  getPetById: async (id: number) => {
    const response = await api.get<Pet>(`/pets/${id}`);
    return response.data;
  },
  createPet: async (petData: Omit<Pet, 'id'>) => {
    const response = await api.post<Pet>('/pets', petData);
    return response.data;
  },
  updatePet: async (id: number, petData: Partial<Pet>) => {
    const response = await api.patch<Pet>(`/pets/${id}`, petData);
    return response.data;
  },
  deletePet: async (id: number) => {
    await api.delete(`/pets/${id}`);
  },
};

export const adminApi = {
  getPendingUsers: async () => {
    const response = await api.get<PendingUser[]>('/pendingUsers');
    return response.data;
  },
  approveUser: async (id: number) => {
    const pendingUser = await api.get<PendingUser>(`/pendingUsers/${id}`);
    const { fullName, email, password } = pendingUser.data;
    await api.post<User>('/users', {
      fullName,
      email,
      password,
      isAdmin: false,
      isApproved: true,
    });
    await api.delete(`/pendingUsers/${id}`);
  },
  rejectUser: async (id: number) => {
    await api.delete(`/pendingUsers/${id}`);
  },
  makeAdmin: async (id: number) => {
    const response = await api.patch<User>(`/users/${id}`, { isAdmin: true });
    return response.data;
  },
};

export default api; 