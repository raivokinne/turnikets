import { Student } from './students';

export interface LogEntry {
    id: number;
    time: string;
    student_id: number;
    action?: string;
    description?: string;
    created_at: string;
    updated_at: string;
    student?: Student;
}

export interface LogWithStudent extends LogEntry {
    student: Student;
}

export interface LogsResponse {
    data: {
        data: LogEntry[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface LogStudentInfo {
    log: LogEntry;
    student: Student;
}