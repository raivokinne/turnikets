import React from 'react';
import { User, Clock } from 'lucide-react';
import { Student } from '@/types/students';

interface StudentCardProps {
  student: Student;
}

const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  const isPresent = student.status === 'klātesošie';

  const statusColor = isPresent ? 'bg-green-100' : 'bg-red-100';
  const statusTextColor = isPresent ? 'text-green-700' : 'text-red-700';
  const iconColor = isPresent ? 'text-green-500' : 'text-red-500';
  const borderColor = isPresent ? 'border-green-200' : 'border-red-200';

  return (
    <div className={`p-2 w-64 rounded-lg border-2 ${borderColor} hover:shadow-md transition-shadow`}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${statusColor}`}>
          <User className={`h-5 w-5 ${iconColor}`} />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{student.name}</h3>

        <p className="text-lg text-gray-700 mb-3">
          Klase: {student.class}
        </p>

        <div className={`py-2 px-4 rounded-full text-lg font-medium mb-2 ${statusColor} ${statusTextColor}`}>
          {student.status}
        </div>

        <div className="flex items-center text-gray-600 text-lg">
          <Clock className="h-5 w-5 mr-2" />
          {student.time}
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
