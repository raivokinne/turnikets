
import React from 'react';
import StudentCard from './StudentCard';
import { LogStudentInfo } from '@/types/logs';
import { Student } from '@/types/students';
import { Search } from 'lucide-react';

interface StudentListProps {
    logStudentData: LogStudentInfo[];
}

const StudentList: React.FC<StudentListProps> = ({ logStudentData }) => {
    const processedStudents: Student[] = logStudentData.map(({ log, student }) => {
        const processedStudent = { ...student };

        if (log.action?.toLowerCase() === 'exit') {
            processedStudent.status = 'klātbūtnē → prombūtnē';
        } else if (log.action?.toLowerCase() === 'entry') {
            processedStudent.status = 'prombūtnē → klātbūtnē';
        }

        if (log.time) {
            const logDate = new Date(log.time);
            const year = logDate.getFullYear();
            const month = String(logDate.getMonth() + 1).padStart(2, '0');
            const day = String(logDate.getDate()).padStart(2, '0');
            const hours = String(logDate.getHours()).padStart(2, '0');
            const minutes = String(logDate.getMinutes()).padStart(2, '0');
            const seconds = String(logDate.getSeconds()).padStart(2, '0');

            processedStudent.time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        return processedStudent;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
                Šodienas apmeklējums
            </h2>

            {processedStudents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {processedStudents.map((student, index) => (
                        <StudentCard key={`${student.id}-${index}`} student={student} />
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

export default StudentList;