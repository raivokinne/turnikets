import React from 'react';
import StudentCard from './StudentCard';
import { Student } from '../types/students';
import { Search } from 'lucide-react';

interface StudentListProps {
  students: Student[];
}

const StudentList: React.FC<StudentListProps> = ({ students }) => {
  const sortedStudents = [...students].sort((a, b) => {
    if (a.status === 'prombūtne' && b.status !== 'prombūtne') return -1;
    if (a.status !== 'prombūtne' && b.status === 'prombūtne') return 1;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Šodienas apmeklējums
      </h2>

      {sortedStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedStudents.map((student) => (
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

export default StudentList;
