import React, { useState } from 'react';
import { studentsApi } from "@/api/students";
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StudentShow } from './StudentShow';

interface StudentManagementProps {
    searchQuery: string;
    selectedClass: string;
    selectedStatus: string;
}

interface Student {
    id: number;
    name: string;
    class: string;
    status: string;
    time?: string;
}

const StudentManagement: React.FC<StudentManagementProps> = ({
                                                                 searchQuery,
                                                                 selectedClass,
                                                                 selectedStatus,
                                                             }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showModal, setShowModal] = useState(false);

    const { data: allStudents = [], isLoading: loading } = useQuery({
        queryKey: ["students"],
        queryFn: () => studentsApi.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const filteredStudents = allStudents.filter((student: Student) => {
        const name = student.name ?? '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());

        const status = student.status ?? '';
        const matchesStatus = !selectedStatus || status === selectedStatus;

        const cls = student.class ?? '';
        const matchesClass = !selectedClass || cls === selectedClass;

        return matchesSearch && matchesClass && matchesStatus;
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
            // Handle different time formats
            const date = new Date(timeString);
            if (isNaN(date.getTime())) {
                return timeString; // Return original if can't parse
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Skolnieki</h2>
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Skolnieki ({filteredStudents.length})
                </h2>

                {filteredStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 h-[800px] overflow-y-auto" style={{ gridAutoRows: 'max-content' }}>
                        {filteredStudents.map((student: Student) => (
                            <div key={student.id} className="group relative" style={{ height: 'fit-content' }}>
                                {/* Main student row */}
                                <div
                                    className="flex items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg group-hover:rounded-b-none transition-all duration-200 cursor-pointer px-3 py-2 relative z-10"
                                    onClick={() => handleStudentClick(student)}
                                >
                                    {/* Status dot */}
                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(student.status)} mr-3 flex-shrink-0`}></div>

                                    {/* Student name - single line */}
                                    <h3 className="text-sm font-medium text-gray-900 mr-2 flex-1 truncate">
                                        {student.name}
                                    </h3>

                                    {/* Class */}
                                    <p className="text-xs text-gray-600 font-medium flex-shrink-0">
                                        {student.class}
                                    </p>
                                </div>

                                {/* Overlay drawer */}
                                <div className="absolute left-0 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-20 pointer-events-none" style={{ top: '100%' }}>
                                    <div className="bg-gray-100 border-l border-r border-b border-gray-300 rounded-b-lg px-3 py-1 shadow-lg">
                                        <div className="flex items-center justify-center text-xs text-gray-600">
                                            {formatTime(student.time)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                        <Search className="h-12 w-12 mb-4 opacity-30" />
                        <p className="font-medium">Nav atrasto skolēnu</p>
                        <p className="mt-2">Pamēģiniet meklēt citu vārdu</p>
                    </div>
                )}
            </div>

            {selectedStudent && (
                <StudentShow
                    student={selectedStudent}
                    show={showModal}
                    setShow={setShowModal}
                />
            )}
        </>
    );
};

export default StudentManagement;