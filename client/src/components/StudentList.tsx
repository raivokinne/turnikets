import { LogStudentInfo } from '@/types/logs';
import { Student } from '@/types/students';
import { Search, ArrowRight, ArrowLeft } from 'lucide-react';

interface StudentListProps {
    logStudentData: LogStudentInfo[];
}

const StudentList: React.FC<StudentListProps> = ({ logStudentData }) => {
    const processedStudents: Student[] = logStudentData.map(({ log, student }) => {
        const processedStudent = { ...student };

        // Keep the original action for processing
        processedStudent.action = log.action;
        processedStudent.description = log.description;

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

    const getActionDisplay = (action: string, description: string) => {
        const actionLower = action?.toLowerCase();
        const descriptionLower = description?.toLowerCase();

        // Check if description contains "divreiz!"
        const hasDivreiz = descriptionLower?.includes('divreiz!');

        if (actionLower === 'exit' || actionLower?.includes('izeja')) {
            return {
                text: 'Izeja',
                color: hasDivreiz ? 'text-white' : 'text-red-600',
                bgColor: hasDivreiz ? 'bg-red-600' : 'bg-red-100',
                icon: <ArrowRight className="w-3 h-3" />,
                containerBg: hasDivreiz ? 'bg-red-200' : 'bg-gray-50',
                containerHoverBg: hasDivreiz ? 'bg-red-300' : 'bg-gray-100'
            };
        } else if (actionLower === 'entry' || actionLower?.includes('ieeja') || actionLower?.includes('ienāca')) {
            return {
                text: 'Ieeja',
                color: hasDivreiz ? 'text-white' : 'text-green-600',
                bgColor: hasDivreiz ? 'bg-green-700' : 'bg-green-100',
                icon: <ArrowLeft className="w-3 h-3" />,
                containerBg: hasDivreiz ? 'bg-red-200' : 'bg-gray-50',
                containerHoverBg: hasDivreiz ? 'bg-red-300' : 'bg-gray-100'
            };
        }

        return {
            text: 'Nav zināms',
            color: hasDivreiz ? 'text-white' : 'text-gray-600',
            bgColor: hasDivreiz ? 'bg-gray-700' : 'bg-gray-100',
            icon: null,
            containerBg: hasDivreiz ? 'bg-red-200' : 'bg-gray-50',
            containerHoverBg: hasDivreiz ? 'bg-red-300' : 'bg-gray-100'
        };
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

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Šodienas apmeklējums ({processedStudents.length})
                </h2>

                {processedStudents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 h-[600px] overflow-y-auto" style={{ gridAutoRows: 'max-content' }}>
                        {processedStudents.map((student, index) => {
                            const actionDisplay = getActionDisplay(student.action, student.description);

                            return (
                                <div key={`${student.id}-${index}`} className="group relative" style={{ height: 'fit-content' }}>
                                    {/* Main student row */}
                                    <div
                                        className={`flex items-center ${actionDisplay.containerBg} hover:${actionDisplay.containerHoverBg} border border-gray-200 hover:border-gray-300 rounded-lg group-hover:rounded-b-none transition-all duration-200 px-3 py-2 relative z-10`}
                                    >
                                        {/* Action badge */}
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mr-3 flex-shrink-0 ${actionDisplay.bgColor} ${actionDisplay.color}`}>
                                            {actionDisplay.icon}
                                            <span>{actionDisplay.text}</span>
                                        </div>

                                        {/* Student name - allow wrapping instead of truncating */}
                                        <h3 className="text-sm font-medium text-gray-900 mr-2 flex-1 leading-tight not-group-hover:truncate">
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
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                        <Search className="h-12 w-12 mb-4 opacity-30" />
                        <p className="font-medium">Nav šodienas apmeklējumu</p>
                        <p className="mt-2">Šodien nav reģistrētas nekādas aktivitātes</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default StudentList;