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

interface FilterState {
  startDate: string;
  endDate: string;
  studentId: string;
  action: string;
  class: string;
}

interface AttendanceData {
  date: string;
  entries: number;
  exits: number;
}

interface StatData {
  name: string;
  value: number;
}

interface ReportData {
  attendance: AttendanceData[];
  actionStats: StatData[];
  classStats: StatData[];
  timeline: LogEntry[];
}

interface StudentActivity {
  [studentName: string]: number;
}

interface HourlyActivity {
  [hour: number]: number;
}

type TabType = 'overview' | 'attendance' | 'analytics' | 'timeline';
