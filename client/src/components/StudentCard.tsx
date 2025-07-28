import { User, Clock, ArrowRight } from 'lucide-react';
import { Student } from '@/types/students';
import { useState } from 'react';
import { StudentShow } from './StudentShow';

interface StudentCardProps {
    student: Student;
}

const StudentCard = ({ student }: StudentCardProps) => {
    const [show, setShow] = useState(false);

    const handleClick = () => {
        setShow(!show);
    };

    const isTransition = student.status?.includes('→');

    const isPresent = student.status === 'klātesošie' || student.status === 'klātbūtne';

    const getStatusDisplay = () => {
        if (isTransition) {
            const parts = student.status!.split(' → ');
            if (parts.length === 2) {
                return (
                    <div className="flex items-center space-x-1 text-sm font-semibold">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                            parts[0] === 'klātbūtnē'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {parts[0]}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className={`px-2 py-1 rounded-full text-xs ${
                            parts[1] === 'klātbūtnē'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {parts[1]}
                        </span>
                    </div>
                );
            }
        }

        // Color the status bubble based on the status value
        const getStatusStyling = () => {
            if (student.status === 'klātbūtne' || student.status === 'klātesošie' || student.status === 'klātbūtnē') {
                return 'bg-green-100 text-green-700 group-hover:bg-green-200';
            } else if (student.status === 'prombutnē' || student.status === 'prombūtnē') {
                return 'bg-red-100 text-red-700 group-hover:bg-red-200';
            } else {
                // Default styling for other statuses
                return 'bg-gray-100 text-gray-700 group-hover:bg-gray-200';
            }
        };

        return (
            <div className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${getStatusStyling()}`}>
                {student.status}
            </div>
        );
    };

    return (
        <>
            {show && <StudentShow show={show} setShow={setShow} student={student} />}
            <div
                onClick={handleClick}
                className={`group relative bg-white border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                    isPresent ? 'border-black hover:border-gray-800' : 'border-gray-300 hover:border-gray-500'
                } rounded-2xl p-6`}
            >
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isPresent ? 'bg-black text-white group-hover:bg-gray-800' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}>
                        <User className="h-8 w-8" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{student.name}</h3>
                        <p className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                            Klase {student.class}
                        </p>
                    </div>

                    {getStatusDisplay()}

                    <div className="flex items-center text-gray-500 text-sm font-medium">
                        <Clock className="h-4 w-4 mr-2" />
                        {student.time}
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentCard;