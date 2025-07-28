
import { api } from '@/utils/api';
import { LogEntry } from '@/types/logs';

export const logsApi = {
    async getLogs(): Promise<LogEntry[]> {
        const response = await api.get('/logs');
        return response.data?.data?.data || [];
    },

    async getLogsByStudent(studentId: number): Promise<LogEntry[]> {
        const response = await api.get(`/logs/student/${studentId}`);
        return response.data?.data?.data || [];
    },

    async getLogsByDateRange(startDate: string, endDate: string): Promise<LogEntry[]> {
        const response = await api.get('/logs', {
            params: {
                start_date: startDate,
                end_date: endDate,
            },
        });
        return response.data?.data?.data || [];
    },

    async createLog(logData: Partial<LogEntry>): Promise<LogEntry> {
        const response = await api.post('/logs', logData);
        return response.data?.data;
    },

    async updateLog(id: number, logData: Partial<LogEntry>): Promise<LogEntry> {
        const response = await api.put(`/logs/${id}`, logData);
        return response.data?.data;
    },

    async deleteLog(id: number): Promise<void> {
        await api.delete(`/logs/${id}`);
    },
};