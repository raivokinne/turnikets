import React, { useState } from 'react';
import { studentsApi } from "@/api/students";
import { Search, X, Filter } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { StudentShow } from './StudentShow';

interface Student {
    id: number;
    name: string;
    class: string;
    status: string;
    time?: string;
    email?: string;
    active?: boolean;
}

const StudentManagement: React.FC = () => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const queryClient = useQueryClient();

    const { data: allStudents = [], isLoading: loading } = useQuery({
        queryKey: ["students"],
        queryFn: () => studentsApi.getAll(),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    useMutation({
        mutationFn: (updatedStudent: Student) => studentsApi.update(updatedStudent.id, updatedStudent),
        onSuccess: (updatedStudent: Student) => {
            queryClient.setQueryData(["students"], (oldStudents: Student[] | undefined) => {
                if (!oldStudents) return [updatedStudent];
                return oldStudents.map(student =>
                    student.id === updatedStudent.id ? { ...student, ...updatedStudent } : student
                );
            });
        },
        onError: (error) => {
            console.error('Failed to update student:', error);
        }
    });

    const normalizeText = (text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[āĀ]/g, 'a')
            .replace(/[ēĒ]/g, 'e')
            .replace(/[īĪ]/g, 'i')
            .replace(/[ōŌ]/g, 'o')
            .replace(/[ūŪ]/g, 'u')
            .replace(/[čČ]/g, 'c')
            .replace(/[ģĢ]/g, 'g')
            .replace(/[ķĶ]/g, 'k')
            .replace(/[ļĻ]/g, 'l')
            .replace(/[ņŅ]/g, 'n')
            .replace(/[šŠ]/g, 's')
            .replace(/[žŽ]/g, 'z');
    };

    const classes = Array.from(new Set(allStudents.map((s: Student) => s.class ?? ''))).filter(Boolean).sort();
    const statuses = Array.from(new Set(allStudents.map((s: Student) => s.status ?? ''))).filter(Boolean).sort();

    const getStatusPriority = (status: string): number => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'klātbūtnē':
            case 'present':
                return 1;
            case 'prombūtnē':
            case 'absent':
                return 2;
            default:
                return 3;
        }
    };

    const filteredStudents = allStudents
        .filter((student: Student) => {
            const name = student.name ?? '';
            const normalizedName = normalizeText(name);
            const normalizedSearch = normalizeText(searchQuery);
            const matchesSearch = normalizedName.includes(normalizedSearch);

            const status = student.status ?? '';
            const matchesStatus = !selectedStatus || status === selectedStatus;

            const cls = student.class ?? '';
            const matchesClass = !selectedClass || cls === selectedClass;

            return matchesSearch && matchesClass && matchesStatus;
        })
        .sort((a: Student, b: Student) => {
            const statusPriorityA = getStatusPriority(a.status);
            const statusPriorityB = getStatusPriority(b.status);

            if (statusPriorityA !== statusPriorityB) {
                return statusPriorityA - statusPriorityB;
            }

            const nameA = (a.name ?? '').toLowerCase();
            const nameB = (b.name ?? '').toLowerCase();

            return nameA.localeCompare(nameB, 'lv', {
                numeric: true,
                sensitivity: 'base'
            });
        });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'klātbūtnē':
            case 'present':
                return 'bg-green-500';
            case 'prombūtnē':
            case 'absent':
                return 'bg-red-500';
            case 'kavējums':
            case 'late':
                return 'bg-yellow-500';
            default:
                return 'bg-gray-400';
        }
    };

    const formatTime = (timeString?: string) => {
        if (!timeString) return 'Nav pieejams';

        try {
            const date = new Date(timeString);
            if (isNaN(date.getTime())) {
                return timeString;
            }

            return date.toLocaleString('lv-LV', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return timeString || 'Nav pieejams';
        }
    };

    const handleStudentClick = (student: Student) => {
        setSelectedStudent(student);
        setShowModal(true);
    };

    const handleStudentUpdate = async (updatedStudent: Student) => {
        try {
            queryClient.setQueryData(["students"], (oldData: Student[] | undefined) => {
                if (!oldData) return oldData;

                return oldData.map(student =>
                    student.id === updatedStudent.id ? updatedStudent : student
                );
            });

            if (selectedStudent?.id === updatedStudent.id) {
                setSelectedStudent(updatedStudent);
            }

        } catch (error) {
            console.error('Failed to update student:', error);
            queryClient.invalidateQueries({ queryKey: ["students"] });
        }
    };

    const handleStudentDelete = async (studentId: number) => {
        try {
            queryClient.setQueryData(["students"], (oldData: Student[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.filter(student => student.id !== studentId);
            });

            if (selectedStudent?.id === studentId) {
                setSelectedStudent(null);
                setShowModal(false);
            }

        } catch (error) {
            console.error('Failed to delete student:', error);
            queryClient.invalidateQueries({ queryKey: ["students"] });
        }
    };

    const handleStudentAdd = (newStudent: Student) => {
        queryClient.setQueryData(["students"], (oldData: Student[] | undefined) => {
            if (!oldData) return [newStudent];
            return [...oldData, newStudent];
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedClass('');
        setSelectedStatus('');
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Skolnieki</h2>
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        Skolnieki ({filteredStudents.length})
                    </h2>
                    {(searchQuery || selectedClass || selectedStatus) && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Notīrīt filtrus
                        </button>
                    )}
                </div>

                {/* Search and Filters */}
                <div className="space-y-4 mb-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Meklēt skolēnus..."
                            className="w-full h-11 px-4 pl-11 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        {searchQuery && (
                            <button
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors duration-200"
                                onClick={() => setSearchQuery('')}
                                aria-label="Notīrīt meklēšanu"
                            >
                                <X className="h-3 w-3 text-gray-600" />
                            </button>
                        )}
                    </div>

                    {/* Filter Row */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                className="h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">Visas klases</option>
                                {classes.map((className) => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                className="h-11 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="">Visi statusi</option>
                                {statuses.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchQuery || selectedClass || selectedStatus) && (
                        <div className="flex flex-wrap gap-2">
                            {searchQuery && (
                                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    Meklē: "{searchQuery}"
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="ml-2 h-4 w-4 flex items-center justify-center bg-blue-200 hover:bg-blue-300 rounded-full transition-colors duration-200"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {selectedClass && (
                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    Klase: {selectedClass}
                                    <button
                                        onClick={() => setSelectedClass('')}
                                        className="ml-2 h-4 w-4 flex items-center justify-center bg-green-200 hover:bg-green-300 rounded-full transition-colors duration-200"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                            {selectedStatus && (
                                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                    Status: {selectedStatus}
                                    <button
                                        onClick={() => setSelectedStatus('')}
                                        className="ml-2 h-4 w-4 flex items-center justify-center bg-purple-200 hover:bg-purple-300 rounded-full transition-colors duration-200"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Students Grid */}
                {filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 h-[600px] overflow-y-auto pr-2" style={{ gridAutoRows: 'max-content' }}>
                        {filteredStudents.map((student: Student) => (
                            <div key={student.id} className="group relative" style={{ height: 'fit-content' }}>
                                {/* Main student card */}
                                <div
                                    className={`flex items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 hover:shadow-sm rounded-lg group-hover:rounded-b-none transition-all duration-200 cursor-pointer px-3 py-2.5 relative z-10 ${
                                        student.active === false ? 'opacity-60' : ''
                                    }`}
                                    onClick={() => handleStudentClick(student)}
                                >
                                    {/* Status dot */}
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(student.status)} mr-3 flex-shrink-0 shadow-sm`}></div>

                                    {/* Student info - now horizontal layout */}
                                    <div className="flex-1 min-w-0 flex items-center relative">
                                        {/* Truncated name - shown by default */}
                                        <span className="text-sm font-medium text-gray-900 truncate group-hover:opacity-0 transition-opacity duration-200">
                                            {student.name}
                                        </span>

                                        {/* Full name overlay - shown on hover */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-100 -mx-1 px-1 rounded flex items-center z-20">
                                            <span className="text-sm font-medium text-gray-900">
                                                {student.name}
                                            </span>
                                        </div>

                                        <span className="text-xs text-gray-500 font-medium bg-gray-200 px-2 py-1 rounded-full flex-shrink-0 ml-2 group-hover:invisible">
                                            {student.class}
                                        </span>
                                    </div>
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-20 pointer-events-none" style={{ top: '100%' }}>
                                    <div className="bg-gray-100 border-l border-r border-b border-gray-300 rounded-b-lg px-3 py-2 shadow-lg">
                                        <div className="text-xs text-gray-600 flex items-center justify-between">
                                            <div className="opacity-75">
                                                {formatTime(student.time)}
                                            </div>
                                            <div className="text-xs text-gray-500 font-medium bg-gray-200 px-2 py-1 rounded-full ml-2">
                                                {student.class}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                        <Search className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">Nav atrasto skolēnu</p>
                        <p className="text-sm text-center">
                            {searchQuery || selectedClass || selectedStatus
                                ? 'Pamēģiniet mainīt meklēšanas kritērijus'
                                : 'Nav reģistrēto skolēnu'
                            }
                        </p>
                        {(searchQuery || selectedClass || selectedStatus) && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                            >
                                Notīrīt filtrus
                            </button>
                        )}
                    </div>
                )}
            </div>

            {selectedStudent && (
                <StudentShow
                    student={selectedStudent}
                    show={showModal}
                    setShow={setShowModal}
                    onStudentUpdate={handleStudentUpdate}
                    onStudentDelete={handleStudentDelete}
                    onStudentAdd={handleStudentAdd}
                />
            )}
        </>
    );
};

export default StudentManagement;