import React from 'react';
import { studentsApi } from "@/api/students";
import StudentCard from './StudentCard';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface StudentManagementProps {
    searchQuery: string;
    selectedClass: string;
    selectedStatus: string;
}

const StudentManagement: React.FC<StudentManagementProps> = ({
    searchQuery,
    selectedClass,
    selectedStatus,
}) => {
    const { data: allStudents = [], isLoading: loading } = useQuery({
        queryKey: ["students"],
        queryFn: () => studentsApi.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const filteredStudents = allStudents.filter(student => {
        const name = student.name ?? '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());

        const status = student.status ?? '';
        const matchesStatus = !selectedStatus || status === selectedStatus;

        const cls = student.class ?? '';
        const matchesClass = !selectedClass || cls === selectedClass;

        return matchesSearch && matchesClass && matchesStatus;
    });

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Skolnieki</h2>
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
                Skolnieki ({filteredStudents.length})
            </h2>

            {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-[800px] overflow-y-scroll">
                    {filteredStudents.map((student) => (
                        <StudentCard key={student.id} student={student} />
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
    );
};

export default StudentManagement;
