import { User, Clock } from 'lucide-react';
import { Student } from '@/types/students';
import { useState } from 'react';
import { StudentShow } from './StudentShow';

interface StudentCardProps {
    student: Student;
}

const StudentCard = ({ student }: StudentCardProps) => {
    const isPresent = student.status === 'klātesošie';
    const [show, setShow] = useState(false);

    const handleClick = () => {
        setShow(!show);
    };

    return (
        <>
            {show && <StudentShow show={show} setShow={setShow} student={student} />}
            <div onClick={handleClick} className={`group relative bg-white border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${isPresent ? 'border-black hover:border-gray-800' : 'border-gray-300 hover:border-gray-500'
                } rounded-2xl p-6`}>
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${isPresent ? 'bg-black text-white group-hover:bg-gray-800' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}>
                        <User className="h-8 w-8" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{student.name}</h3>
                        <p className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                            Klase {student.class}
                        </p>
                    </div>

                    <div className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${isPresent
                        ? 'bg-black text-white group-hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                        }`}>
                        {student.status}
                    </div>

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
