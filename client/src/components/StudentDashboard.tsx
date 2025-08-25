import React, { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';
import StudentList from './StudentList';
import StudentManagement from './StudentManagement';
import QuickActions from './QuickActions';
import { Student } from '@/types/students';
import { LogEntry, LogStudentInfo } from '@/types/logs';
import { logsApi } from '@/api/logs';
import { studentsApi } from '@/api/students';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryClient, useQuery } from '@tanstack/react-query';

interface NewLogData {
    log?: {
        id: number;
        time: string;
        action: string;
        description: string;
        student_id: number;
    };
    student?: {
        id: number;
        name: string;
        status?: string;
    };
    timestamp: string;
}

const SimpleStudentDashboard: React.FC = () => {
    const [attendanceData, setAttendanceData] = useState<Student[]>([]);
    const [logStudentData, setLogStudentData] = useState<LogStudentInfo[]>([]);
    const [activeTab, setActiveTab] = useState('attendance');
    const [wsConnected, setWsConnected] = useState(false);

    const queryClient = useQueryClient();

    // Pre-fetch student data when component loads
    const { data: allStudents = [], isLoading: studentsLoading } = useQuery({
        queryKey: ["students"],
        queryFn: () => studentsApi.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const addNewLogEntry = useCallback((data: NewLogData) => {
        if (data.log && data.student) {
            const newStudent: Student = {
                id: data.student.id,
                name: data.student.name,
                class: '',
                status: data.student.status || '',
                email: '',
                time: data.log.time
            };

            const newLogStudentPair: LogStudentInfo = {
                log: {
                    id: data.log.id,
                    time: data.log.time,
                    action: data.log.action,
                    description: data.log.description,
                    student_id: data.log.student_id,
                    student: {
                        name: data.student.name,
                        class: undefined
                    }
                } as LogEntry,
                student: newStudent
            };

            // Update attendance data
            setAttendanceData(prev => {
                const existingIndex = prev.findIndex(s => s.id === newStudent.id);
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = { ...updated[existingIndex], ...newStudent };
                    return updated;
                } else {
                    return [...prev, newStudent];
                }
            });

            // Update log data
            setLogStudentData(prev => [newLogStudentPair, ...prev]);

            // Update student status based on log action
            const actionLower = data.log.action.toLowerCase();
            let newStatus = '';

            if (actionLower === 'entry' || actionLower.includes('ieeja') || actionLower.includes('ienāca')) {
                newStatus = 'klātbūtnē';
            } else if (actionLower === 'exit' || actionLower.includes('izeja')) {
                newStatus = 'prombūtnē';
            }

            // Only update if we have a valid status to set
            if (newStatus) {
                console.log(`Updating student ${data.student.name} (ID: ${data.student.id}) status to ${newStatus}`);

                // Update the React Query cache for students
                queryClient.setQueryData(["students"], (oldData: Student[] | undefined) => {
                    if (!oldData) {
                        console.log('No existing student data found in cache');
                        return oldData;
                    }

                    console.log('Current students in cache:', oldData.length);

                    const updatedData = oldData.map(student => {
                        if (student.id === data.student!.id) {
                            console.log(`Found matching student: ${student.name}, updating status from ${student.status} to ${newStatus}`);
                            return { ...student, status: newStatus, time: data.log!.time };
                        }
                        return student;
                    });

                    // Check if we found and updated any student
                    const wasUpdated = updatedData.some(student =>
                        student.id === data.student!.id && student.status === newStatus
                    );

                    if (!wasUpdated) {
                        console.log(`No student found with ID ${data.student!.id} in cache`);
                        console.log('Available student IDs:', oldData.map(s => s.id));
                    }

                    return updatedData;
                });

                // Also invalidate the query to force a refetch if needed
                queryClient.invalidateQueries({ queryKey: ["students"] });
            }
        }
    }, [queryClient]);

    useEffect(() => {
        const appKey = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
        const host = import.meta.env.VITE_REVERB_HOST as string | undefined;
        const port = import.meta.env.VITE_REVERB_PORT as string | undefined;
        const scheme = import.meta.env.VITE_REVERB_SCHEME as string | undefined;

        if (!appKey || !host || !port) {
            console.warn('Reverb configuration is incomplete. Skipping WebSocket connection.');
            console.warn('Required: VITE_REVERB_APP_KEY, VITE_REVERB_HOST, VITE_REVERB_PORT');
            return;
        }

        const pusher = new Pusher(appKey, {
            wsHost: host,
            wsPort: parseInt(port),
            wssPort: parseInt(port),
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            cluster: '', // Not needed for Reverb
        });

        pusher.connection.bind('connected', () => {
            setWsConnected(true);
        });

        pusher.connection.bind('disconnected', () => {
            setWsConnected(false);
        });

        const logsChannel = pusher.subscribe('logs');

        logsChannel.bind('new-log', (data: NewLogData) => {
            addNewLogEntry(data);
        });

        return () => {
            logsChannel.unbind_all();
            pusher.unsubscribe('logs');
            pusher.disconnect();
        };
    }, [addNewLogEntry]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const logs = await logsApi.getLogs();

                const students = logs
                    .map((log: LogEntry) => log.student)
                    .filter(Boolean) as Student[];

                const logStudentPairs = logs
                    .filter((log: LogEntry) => log.student)
                    .map((log: LogEntry) => ({
                        log,
                        student: {
                            id: 0,
                            name: log.student!.name,
                            class: log.student!.class ?? '',
                            status: '',
                            email: '',
                            time: log.time
                        } as Student
                    }));

                setAttendanceData(students);
                setLogStudentData(logStudentPairs);
            } catch (error) {
                console.error('Failed to fetch initial attendance data:', error);
                setAttendanceData([]);
                setLogStudentData([]);
            }
        };

        fetchInitialData();
    }, []);

    const classes = Array.from(new Set(attendanceData.map(s => s.class ?? ''))).filter(Boolean).sort();
    const statuses = Array.from(new Set(attendanceData.map(s => s.status ?? ''))).filter(Boolean).sort();

    const filteredLogStudents = logStudentData;

    return (
        <div className="p-4 md:p-6">
            <div className="mb-4">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    wsConnected
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                        wsConnected ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {wsConnected ? 'Reāllaiks aktīvs' : 'Savienojums pārtraukts'}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Skolēnu apmeklējums
                </h1>
            </div>

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
                                <StudentManagement />
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