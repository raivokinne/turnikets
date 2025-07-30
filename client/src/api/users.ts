import { api } from '@/utils/api';
import { User, CreateUserData, UpdateUserData, UserStats } from '@/types/users';

export const usersApi = {
    async getUsers(params?: {
        role?: 'admin' | 'employee';
        class?: string;
        search?: string;
        per_page?: number;
    }): Promise<User[]> {
        const response = await api.get('/users', { params });
        return response.data?.data?.data || [];
    },

    async getUserById(id: number): Promise<User> {
        const response = await api.get('/users/show', {
            params: { id }
        });
        return response.data?.data;
    },

    async createUser(userData: CreateUserData): Promise<User> {
        const response = await api.post('/users/store', userData);
        return response.data?.data;
    },

    async updateUser(id: number, userData: UpdateUserData): Promise<User> {
        const response = await api.post('/users/update', {
            id,
            ...userData
        });
        return response.data?.data;
    },

    async deleteUser(id: number): Promise<void> {
        await api.delete('/users/destroy', {
            params: { id }
        });
    },

    async getUsersByRole(role: 'admin' | 'employee'): Promise<User[]> {
        const response = await api.get('/users/by-role', {
            params: { role }
        });
        return response.data?.data || [];
    },

    async getUserStats(): Promise<UserStats> {
        const response = await api.get('/users/stats');
        return response.data?.data;
    },

    async searchUsers(search: string): Promise<User[]> {
        const response = await api.get('/users', {
            params: { search }
        });
        return response.data?.data?.data || [];
    },

    async getUsersByClass(className: string): Promise<User[]> {
        const response = await api.get('/users', {
            params: { class: className }
        });
        return response.data?.data?.data || [];
    },

    async getAdminUsers(): Promise<User[]> {
        return this.getUsersByRole('admin');
    },

    async getEmployeeUsers(): Promise<User[]> {
        return this.getUsersByRole('employee');
    },

    async getPaginatedUsers(params?: {
        role?: 'admin' | 'employee';
        class?: string;
        search?: string;
        per_page?: number;
        page?: number;
    }) {
        const response = await api.get('/users', { params });
        return {
            data: response.data?.data?.data || [],
            pagination: {
                current_page: response.data?.data?.current_page || 1,
                last_page: response.data?.data?.last_page || 1,
                per_page: response.data?.data?.per_page || 15,
                total: response.data?.data?.total || 0,
                from: response.data?.data?.from || 0,
                to: response.data?.data?.to || 0,
            }
        };
    }
};