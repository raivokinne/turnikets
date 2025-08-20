import { Student } from './students';

export interface LogEntry {
    id: number;
    time: string;
    student?: {
        name: string;
        class?: string;
    } | null;
    action?: string | null;
    description?: string | null;
    performed_by_user?: {
        name: string;
        role?: 'admin' | 'employee';
    } | null;
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

export interface FilterState {
    startDate: string;
    endDate: string;
    studentId: string;
    action: string;
    class: string;
}

export interface AttendanceData {
    date: string;
    entries: number;
    exits: number;
}

export interface StatData {
    name: string;
    value: number;
}

export interface ReportData {
    attendance: AttendanceData[];
    actionStats: StatData[];
    classStats: StatData[];
    timeline: LogEntry[];
}

export interface StudentActivity {
    [studentName: string]: number;
}

export interface HourlyActivity {
    [hour: number]: number;
}

export type TabType = 'overview' | 'attendance' | 'analytics' | 'timeline';
