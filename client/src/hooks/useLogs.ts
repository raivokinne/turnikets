import { useEffect, useState } from "react";
import { logsApi } from "@/api/logs";
import { LogEntry } from "@/types/logs";

export const useLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            try {
                const response = await logsApi.getLogs();
                setLogs(response);
            } catch (error) {
                console.error('Error fetching logs:', error);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    const getLogsByStudent = async (studentId: number) => {
        setLoading(true);
        try {
            const response = await logsApi.getLogsByStudent(studentId);
            setLogs(response);
        } catch (error) {
            console.error('Error fetching logs by student:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const getLogsByDateRange = async (startDate: string, endDate: string, perPage = 1000) => {
        setLoading(true);
        try {
            // Fetch logs with a higher per_page limit for reports
            const response = await logsApi.getLogsByDateRange(startDate, endDate, perPage);
            setLogs(response);
            return response;
        } catch (error) {
            console.error('Error fetching logs by date range:', error);
            setLogs([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // New method specifically for reports that fetches all logs without pagination
    const getAllLogsForReport = async (startDate: string, endDate: string) => {
        setLoading(true);
        try {
            // Use the dedicated report endpoint that has no pagination limits
            const response = await logsApi.getAllLogsForReport(startDate, endDate);
            return response;
        } catch (error) {
            console.error('Error fetching all logs for report:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const createLog = async (logData: Partial<LogEntry>) => {
        try {
            const response = await logsApi.createLog(logData);
            setLogs([response, ...logs]);
            return response;
        } catch (error) {
            console.error('Error creating log:', error);
            throw error;
        }
    };

    const updateLog = async (id: number, logData: Partial<LogEntry>) => {
        try {
            const response = await logsApi.updateLog(id, logData);
            setLogs(logs.map((log) => (log.id === id ? response : log)));
            return response;
        } catch (error) {
            console.error('Error updating log:', error);
            throw error;
        }
    };

    const deleteLog = async (id: number) => {
        try {
            await logsApi.deleteLog(id);
            setLogs(logs.filter((log) => log.id !== id));
        } catch (error) {
            console.error('Error deleting log:', error);
            throw error;
        }
    };

    return {
        logs,
        loading,
        getLogsByStudent,
        getLogsByDateRange,
        getAllLogsForReport,
        createLog,
        updateLog,
        deleteLog,
    };
};