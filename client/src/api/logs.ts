import { api } from '@/utils/api';
import { LogEntry } from '@/types/logs';

export const logsApi = {
    async getLogs(perPage: number = 50): Promise<LogEntry[]> {
        const response = await api.get('/logs', {
            params: {
                per_page: perPage
            }
        });
        return response.data?.data?.data || [];
    },

    async getLogsByStudent(studentId: number): Promise<LogEntry[]> {
        const response = await api.get(`/logs/student/${studentId}`);
        return response.data?.data?.data || [];
    },

    async getLogsByDateRange(startDate: string, endDate: string, perPage: number = 1000): Promise<LogEntry[]> {
        const response = await api.get('/logs', {
            params: {
                start_date: startDate,
                end_date: endDate,
                per_page: perPage
            },
        });
        return response.data?.data?.data || [];
    },

    // Add a specific method for reports that gets ALL data
    async getAllLogsForReport(startDate: string, endDate: string): Promise<LogEntry[]> {
        const response = await api.get('/logs/report-data', {
            params: {
                start_date: startDate,
                end_date: endDate
            },
        });
        return response.data?.data || [];
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