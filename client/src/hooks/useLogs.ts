import { useEffect, useState } from "react";
import { logsApi } from "@/api/logs";
import { LogEntry } from "@/types/logs";

export const useLogs = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        async function fetchLogs() {
            const response = await logsApi.getLogs();
            setLogs(response);
        }
        fetchLogs();
    }, []);

    const getLogsByStudent = async (studentId: number) => {
        const response = await logsApi.getLogsByStudent(studentId);
        setLogs(response);
    };

    const getLogsByDateRange = async (startDate: string, endDate: string) => {
        const response = await logsApi.getLogsByDateRange(startDate, endDate);
        setLogs(response);
    };

    const createLog = async (logData: Partial<LogEntry>) => {
        const response = await logsApi.createLog(logData);
        setLogs([...logs, response]);
    };

    const updateLog = async (id: number, logData: Partial<LogEntry>) => {
        const response = await logsApi.updateLog(id, logData);
        setLogs(logs.map((log) => (log.id === id ? response : log)));
    };

    const deleteLog = async (id: number) => {
        await logsApi.deleteLog(id);
        setLogs(logs.filter((log) => log.id !== id));
    };

    return {
        logs,
        getLogsByStudent,
        getLogsByDateRange,
        createLog,
        updateLog,
        deleteLog,
    };
};
