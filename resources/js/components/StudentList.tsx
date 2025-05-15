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
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Šodienas apmeklējums
      </h2>

      {sortedStudents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {sortedStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
          <Search className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-xl font-medium">Nav atrasto skolēnu</p>
          <p className="text-lg mt-2">Pamēģiniet meklēt citu vārdu</p>
        </div>
      )}
    </div>
  );
};

export default StudentList;
