import React, { useEffect, useState } from 'react';
import StudentHeader from './StudentHeader';
import StudentList from './StudentList';
import QuickActions from './QuickActions';
import { Student } from '@/types/students';
import { api } from '@/utils/api';

const SimpleStudentDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [attendanceData, setAttendanceData] = useState<Student[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const resp = await api.get('/logs');
                const studentLogs = resp.data?.data?.data;
                const students = studentLogs
                    .map((log: any) => log.student)
                    .filter(Boolean);
                setAttendanceData(students);
            } catch (error) {
                console.error('Failed to fetch attendance data:', error);
                setAttendanceData([]);
            }
        }
        fetchData();
    }, []);

    const classes = Array.from(new Set(attendanceData.map(s => s.class ?? ''))).filter(Boolean).sort();

    const statuses = Array.from(new Set(attendanceData.map(s => s.status ?? ''))).filter(Boolean).sort();

    const filteredStudents = attendanceData.filter(student => {
        const name = student.name ?? '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());

        const status = student.status ?? '';
        const matchesStatus = !selectedStatus || status === selectedStatus;

        const cls = student.class ?? '';
        const matchesClass = !selectedClass || cls === selectedClass;

        return matchesSearch && matchesClass && matchesStatus;
    });

    return (
        <div className="p-4 md:p-6">
            <StudentHeader
                title="Skolēnu apmeklējums"
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedClass={selectedClass}
                selectedStatus={selectedStatus}
                setSelectedClass={setSelectedClass}
                setSelectedStatus={setSelectedStatus}
                classes={classes}
                statuses={statuses}
            />
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <StudentList students={filteredStudents} />
                </div>
                <div className="lg:col-span-1">
                    <QuickActions />
                </div>
            </div>
        </div>
    );
};

export default SimpleStudentDashboard;
