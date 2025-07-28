import React from 'react';
import { LogStudentInfo } from '@/types/logs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, ArrowRight } from 'lucide-react';

interface LogStudentItemProps {
    logStudentInfo: LogStudentInfo;
    showFullDetails?: boolean;
    onStudentClick?: (studentId: number) => void;
    onLogClick?: (logId: number) => void;
}

const LogStudentItem: React.FC<LogStudentItemProps> = ({
                                                           logStudentInfo,
                                                           showFullDetails = false,
                                                           onStudentClick,
                                                           onLogClick,
                                                       }) => {
    const { log, student } = logStudentInfo;

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('lv-LV', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusDisplay = (action: string | undefined) => {
        if (!action) {
            return student.status ? (
                <Badge variant={student.status === 'present' ? 'default' : 'secondary'}>
                    {student.status}
                </Badge>
            ) : null;
        }

        const actionLower = action.toLowerCase();

        if (actionLower === 'entry') {
            return (
                <div className="flex items-center space-x-1">
                    <Badge variant="destructive" className="text-xs bg-red-100 text-red-700 border-red-200">
                        prombūtne
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
                        klātbūtne
                    </Badge>
                </div>
            );
        } else if (actionLower === 'exit') {
            return (
                <div className="flex items-center space-x-1">
                    <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
                        klātbūtne
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <Badge variant="destructive" className="text-xs bg-red-100 text-red-700 border-red-200">
                        prombūtne
                    </Badge>
                </div>
            );
        }

        return student.status ? (
            <Badge variant={student.status === 'present' ? 'default' : 'secondary'}>
                {student.status}
            </Badge>
        ) : null;
    };

    return (
        <Card className="w-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Avatar
                            className="cursor-pointer"
                            onClick={() => onStudentClick?.(student.id)}
                        >
                            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                        </Avatar>

                        <div>
                            <h3
                                className="font-medium text-sm cursor-pointer hover:text-blue-600"
                                onClick={() => onStudentClick?.(student.id)}
                            >
                                {student.name}
                            </h3>
                            {student.class && (
                                <p className="text-xs text-gray-500">{student.class}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {getStatusDisplay(log.action)}
                        <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(log.time)}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-2">
                    {log.action && (
                        <div className="flex items-center text-sm">
                            <span className="font-medium text-gray-700">Darbība:</span>
                            <span className="ml-1">
                                {log.action === 'entry' ? 'Ienākšana' : log.action === 'exit' ? 'Iziet' : log.action}
                            </span>
                        </div>
                    )}

                    {log.description && (
                        <div className="text-sm">
                            <span className="font-medium text-gray-700">Apraksts:</span>
                            <p className="mt-1 text-gray-600 leading-relaxed">
                                {log.description}
                            </p>
                        </div>
                    )}

                    {showFullDetails && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                <div>
                                    <span className="font-medium">Log ID:</span> {log.id}
                                </div>
                                <div>
                                    <span className="font-medium">Student ID:</span> {student.id}
                                </div>
                                <div>
                                    <span className="font-medium">Created:</span> {formatTime(log.created_at)}
                                </div>
                                <div>
                                    <span className="font-medium">Updated:</span> {formatTime(log.updated_at)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {(onLogClick || onStudentClick) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex space-x-2">
                        {onStudentClick && (
                            <button
                                onClick={() => onStudentClick(student.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Skatīt profilu
                            </button>
                        )}
                        {onLogClick && (
                            <button
                                onClick={() => onLogClick(log.id)}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                            >
                                Skatīt žurnāla ierakstu
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LogStudentItem;