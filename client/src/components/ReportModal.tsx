import React, { useEffect, useState, useCallback } from 'react';
import { X, Download, FileText, Filter, Search } from 'lucide-react';
import { LogEntry } from '@/types/logs';
import { useLogs } from '@/hooks/useLogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// TypeScript interfaces for Report
interface FilterState {
    startDate: string;
    endDate: string;
    startTime: string; // intraday start time (HH:MM)
    endTime: string;   // intraday end time (HH:MM)
    query: string;     // new: search by name or email
    action: string;
    class: string;
}

interface AttendanceData {
    date: string;
    entries: number;
    exits: number;
}

interface StatData {
    name: string;
    value: number;
}

interface ReportData {
    attendance: AttendanceData[];
    actionStats: StatData[];
    classStats: StatData[];
    timeline: LogEntry[];
}

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
    const { logs, getLogsByDateRange } = useLogs();

    const [filters, setFilters] = useState<FilterState>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        startTime: '00:00',
        endTime: '23:59',
        query: '',
        action: '',
        class: ''
    });

    const [reportData, setReportData] = useState<ReportData>({
        attendance: [],
        actionStats: [],
        classStats: [],
        timeline: []
    });

    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Apply frontend filters to logs
    const applyFrontendFilters = useCallback((logsToFilter: LogEntry[]) => {
        let filtered = [...logsToFilter];

        // Filter by time range if specified
        if (filters.startTime !== '00:00' || filters.endTime !== '23:59') {
            filtered = filtered.filter(l => {
                if (!l.time) return false;

                try {
                    // Parse ISO date string and convert to local time
                    const logDate = new Date(l.time);
                    const logTime = logDate.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }); // Format: "HH:MM"

                    const logTimeMinutes = parseInt(logTime.split(':')[0]) * 60 + parseInt(logTime.split(':')[1]);
                    const startTimeMinutes = parseInt(filters.startTime.split(':')[0]) * 60 + parseInt(filters.startTime.split(':')[1]);
                    const endTimeMinutes = parseInt(filters.endTime.split(':')[0]) * 60 + parseInt(filters.endTime.split(':')[1]);

                    return logTimeMinutes >= startTimeMinutes && logTimeMinutes <= endTimeMinutes;
                } catch (error) {
                    return false;
                }
            });
        }

        // Filter by query (name or email) if provided
        if (filters.query && filters.query.trim() !== '') {
            const q = filters.query.trim().toLowerCase();
            filtered = filtered.filter(l => {
                const name = (l.student?.name || '').toString().toLowerCase();
                const email = (l.student?.email || '').toString().toLowerCase();
                return name.includes(q) || email.includes(q);
            });
        }

        // Filter by action (if selected)
        if (filters.action) {
            filtered = filtered.filter(l => l.action === filters.action);
        }

        // Filter by class (if selected)
        if (filters.class) {
            filtered = filtered.filter(l => l.student?.class === filters.class);
        }

        return filtered;
    }, [filters.startTime, filters.endTime, filters.query, filters.action, filters.class]);

    // Build report from given logs (or from hook logs if not provided)
    const buildReportFromLogs = useCallback((logsToUse?: LogEntry[]) => {
        const sourceLogs = logsToUse || logs;
        if (!sourceLogs || !sourceLogs.length) {
            setReportData({ attendance: [], actionStats: [], classStats: [], timeline: [] });
            return;
        }

        // Process attendance data
        interface AttendanceAccumulator {
            [date: string]: {
                date: string;
                entries: number;
                exits: number;
            };
        }

        const attendanceByDate = sourceLogs
            .filter((log: LogEntry) => ['entry', 'exit'].includes(log.action || ''))
            .reduce<AttendanceAccumulator>((acc, log) => {
                // assume log.time is like 'YYYY-MM-DD HH:MM:SS' or ISO string
                const date = (log.time || '').split(' ')[0];
                if (!acc[date]) acc[date] = { date, entries: 0, exits: 0 };
                if (log.action === 'entry') {
                    acc[date].entries++;
                } else if (log.action === 'exit') {
                    acc[date].exits++;
                }
                return acc;
            }, {});

        // Process action statistics
        interface ActionAccumulator {
            [action: string]: number;
        }

        const actionStats = sourceLogs.reduce<ActionAccumulator>((acc, log) => {
            const action = log.action || 'unknown';
            if (!acc[action]) acc[action] = 0;
            acc[action]++;
            return acc;
        }, {});

        // Process class statistics
        interface ClassAccumulator {
            [className: string]: number;
        }

        const classStats = sourceLogs
            .filter((log: LogEntry) => log.student?.class)
            .reduce<ClassAccumulator>((acc, log) => {
                const className = log.student!.class;
                if (!acc[className]) acc[className] = 0;
                acc[className]++;
                return acc;
            }, {});

        setReportData({
            attendance: Object.values(attendanceByDate),
            actionStats: Object.entries(actionStats).map(([name, value]) => ({ name, value })),
            classStats: Object.entries(classStats).map(([name, value]) => ({ name, value })),
            timeline: sourceLogs.slice(0, 10)
        });
    }, [logs]);

    // Apply filters whenever logs or filter criteria change
    useEffect(() => {
        if (logs && logs.length > 0) {
            const filtered = applyFrontendFilters(logs);
            setFilteredLogs(filtered);
            buildReportFromLogs(filtered);
        } else {
            setFilteredLogs([]);
            buildReportFromLogs([]);
        }
    }, [logs, applyFrontendFilters, buildReportFromLogs]);

    const handleFilterChange = (key: keyof FilterState, value: string): void => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = async (): Promise<void> => {
        setLoading(true);
        try {
            // Fetch logs by date range first
            await getLogsByDateRange(filters.startDate, filters.endDate);
            // The useEffect will automatically apply frontend filters when logs update
        } catch (error) {
            console.error('Error applying filters:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeString: string) => {
        if (!dateTimeString) return { date: 'N/A', time: 'N/A' };

        try {
            const date = new Date(dateTimeString);
            const localDate = date.toLocaleDateString('lv-LV'); // Latvian format
            const localTime = date.toLocaleTimeString('lv-LV', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            return { date: localDate, time: localTime };
        } catch (error) {
            return { date: 'N/A', time: 'N/A' };
        }
    };

    const exportToCSV = (): void => {
        const headers: string[] = ['Date', 'Time', 'Student ID', 'Student Name', 'Student Email', 'Action', 'Class', 'Description'];
        const csvData = [
            headers.join(','),
            ...filteredLogs.map((log: LogEntry) => {
                const { date, time } = formatDateTime(log.time || '');
                return [
                    date,
                    time,
                    (log.student_id || '').toString(),
                    log.student?.name || 'N/A',
                    log.student?.email || 'N/A',
                    log.action || 'N/A',
                    log.student?.class || 'N/A',
                    log.description || ''
                ].map((field: string) => `"${field}"`).join(',');
            })
        ].join('\n');

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_report_${filters.startDate}_${filters.endDate}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportToPDF = (): void => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const printContent = `
<!DOCTYPE html>
<html>
<head>
<title>Aktivitāšu atskaite</title>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
.header { text-align: center; margin-bottom: 30px; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
.summary-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
th { background-color: #f5f5f5; }
</style>
</head>
<body>

<h2>aktivitātes</h2>
<table>
<thead>
<tr>
<th>Datums</th>
<th>Laiks</th>
<th>Skolēns</th>
<th>Darbība</th>
</tr>
</thead>
<tbody>
${filteredLogs.slice(0, 20).map((log: LogEntry) => {
            const { date, time } = formatDateTime(log.time || '');
            return `
<tr>
<td>${date}</td>
<td>${time}</td>
<td>${log.student?.name || 'N/A'}</td>
<td>${log.action === 'entry' ? 'Ieeja' : log.action === 'exit' ? 'Izeja' : log.action || 'N/A'}</td>
</tr>
`;
        }).join('')}
</tbody>
</table>
</body>
</html>
`;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Aktivitāšu atskaites</h2>
                            <p className="text-gray-600 mt-1">Žurnāla analīzes</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                type="button"
                            >
                                <Download size={16} />
                                Eksportēt CSV
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                type="button"
                            >
                                <FileText size={16} />
                                Eksportēt PDF
                            </button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-2">
                    {/* Filters */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={20} />
                            <h3 className="text-lg font-semibold">Filtri</h3>
                        </div>
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sākuma datums</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Beigu datums</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sākuma laiks</label>
                                <input
                                    type="time"
                                    step="60"
                                    value={filters.startTime}
                                    onChange={(e) => handleFilterChange('startTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Beigu laiks</label>
                                <input
                                    type="time"
                                    step="60"
                                    value={filters.endTime}
                                    onChange={(e) => handleFilterChange('endTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-1 min-w-[140px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Darbība</label>
                                <select
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Visas darbības</option>
                                    <option value="entry">Ieeja</option>
                                    <option value="exit">Izeja</option>
                                </select>
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meklēt skolēnu</label>
                                <input
                                    type="text"
                                    placeholder="Vārds vai e-pasts..."
                                    value={filters.query}
                                    onChange={(e) => handleFilterChange('query', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex-shrink-0">
                                <button
                                    onClick={applyFilters}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    type="button"
                                >
                                    {loading ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                        <Search size={16} />
                                    )}
                                    Lietot filtrus
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Total Records Summary */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Kopā ierakstu</p>
                                <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
                                <p className="text-xs text-gray-500 mt-1">No {(logs || []).length} kopējiem ierakstiem</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Pēdējās aktivitātes</h4>
                        <div className="space-y-4">
                            {reportData.timeline.map((log: LogEntry) => {
                                const { date, time } = formatDateTime(log.time || '');
                                return (
                                    <div key={log.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {log.student?.name || 'Nezināms skolēns'} - {log.action === 'entry' ? 'Ieeja' : log.action === 'exit' ? 'Izeja' : log.action || 'Nezināma darbība'}
                                                </p>
                                                <p className="text-xs text-gray-500">{date} {time}</p>
                                            </div>
                                            {log.description && (
                                                <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Klase: {log.student?.class || 'N/A'} | ID: {log.student_id}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReportModal;