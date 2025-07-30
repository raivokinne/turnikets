import React, { useEffect, useState } from 'react';
import StudentHeader from './StudentHeader';
import StudentList from './StudentList';
import StudentManagement from './StudentManagement';
import QuickActions from './QuickActions';
import { Student } from '@/types/students';
import { LogEntry, LogStudentInfo } from '@/types/logs';
import { logsApi } from '@/api/logs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SimpleStudentDashboard: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [attendanceData, setAttendanceData] = useState<Student[]>([]);
    const [logStudentData, setLogStudentData] = useState<LogStudentInfo[]>([]);
    const [activeTab, setActiveTab] = useState('attendance');

    useEffect(() => {
        async function fetchData() {
            try {
                const logs = await logsApi.getLogs();

                const students = logs
                    .map((log: LogEntry) => log.student)
                    .filter(Boolean) as Student[];

                const logStudentPairs = logs
                    .filter((log: LogEntry) => log.student)
                    .map((log: LogEntry) => ({
                        log,
                        student: log.student!
                    }));

                setAttendanceData(students);
                setLogStudentData(logStudentPairs);
            } catch (error) {
                console.error('Failed to fetch attendance data:', error);
                setAttendanceData([]);
                setLogStudentData([]);
            }
        }
        fetchData();
    }, []);

    const classes = Array.from(new Set(attendanceData.map(s => s.class ?? ''))).filter(Boolean).sort();
    const statuses = Array.from(new Set(attendanceData.map(s => s.status ?? ''))).filter(Boolean).sort();

    const filteredLogStudents = logStudentData.filter(({ student }) => {
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

            <div className="mt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="attendance">Šodienas apmeklējums</TabsTrigger>
                        <TabsTrigger value="students">Skolnieki</TabsTrigger>
                    </TabsList>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        <div className="lg:col-span-3">
                            <TabsContent value="attendance" className="mt-0">
                                <StudentList logStudentData={filteredLogStudents} />
                            </TabsContent>

                            <TabsContent value="students" className="mt-0">
                                <StudentManagement
                                    searchQuery={searchQuery}
                                    selectedClass={selectedClass}
                                    selectedStatus={selectedStatus}
                                />
                            </TabsContent>
                        </div>

                        <div className="lg:col-span-1">
                            <QuickActions />
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

export default SimpleStudentDashboard;
