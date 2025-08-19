import React, { useEffect, useState } from 'react';
import { User, QrCode, BookPlus, X, Calendar, Download, FileText, Users, Clock, Filter, BarChart3, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { LogEntry } from '@/types/logs';
import { useLogs } from '@/hooks/useLogs';

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

interface StudentActivity {
    [studentName: string]: number;
}

interface HourlyActivity {
    [hour: number]: number;
}

type TabType = 'overview' | 'attendance' | 'analytics' | 'timeline';

const COLORS: string[] = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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

    const [loading, setLoading] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Build report from given logs (or from hook logs if not provided)
    const buildReportFromLogs = (logsToUse?: LogEntry[]) => {
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
    };

    // run when hook logs change
    useEffect(() => {
        buildReportFromLogs();
    }, [logs]);

    const handleFilterChange = (key: keyof FilterState, value: string): void => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = async (): Promise<void> => {
        setLoading(true);
        try {
            // Build start and end datetimes in format YYYY-MM-DD HH:MM:SS
            const startDateTime = `${filters.startDate} ${filters.startTime}:00`;
            const endDateTime = `${filters.endDate} ${filters.endTime}:59`;

            // fetch logs from hook (assumes getLogsByDateRange will update hook's logs)
            await getLogsByDateRange(startDateTime, endDateTime);

            // After fetching we also apply frontend filters (query, action & class) to the current logs
            // Note: this relies on the hook updating `logs`. If your hook returns the fetched
            // logs directly, you can use that instead.
            let filteredLogs = (logs || []).slice();

            // Filter by query (name or email) if provided
            if (filters.query && filters.query.trim() !== '') {
                const q = filters.query.trim().toLowerCase();
                filteredLogs = filteredLogs.filter(l => {
                    const name = (l.student?.name || '').toString().toLowerCase();
                    const email = (l.student?.email || '').toString().toLowerCase();
                    return name.includes(q) || email.includes(q);
                });
            }

            // Filter by action (if selected)
            if (filters.action) {
                filteredLogs = filteredLogs.filter(l => l.action === filters.action);
            }

            // Filter by class (if selected)
            if (filters.class) {
                filteredLogs = filteredLogs.filter(l => l.student?.class === filters.class);
            }

            // Build report using the filtered set
            buildReportFromLogs(filteredLogs);
        } catch (error) {
            console.error('Error applying filters:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (): void => {
        const headers: string[] = ['Date', 'Time', 'Student ID', 'Student Name', 'Student Email', 'Action', 'Class', 'Description'];
        const csvData = [
            headers.join(','),
            ...(logs || []).map((log: LogEntry) => [
                (log.time || '').split(' ')[0],
                (log.time || '').split(' ')[1] || '',
                (log.student_id || '').toString(),
                log.student?.name || 'N/A',
                log.student?.email || 'N/A',
                log.action || 'N/A',
                log.student?.class || 'N/A',
                log.description || ''
            ].map((field: string) => `"${field}"`).join(','))
        ].join('');

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
<div class="header">
<h1>Aktivitāšu žurnāla atskaite</h1>
<p>Periods: ${filters.startDate} līdz ${filters.endDate}</p>
<p>Izveidots: ${new Date().toLocaleString('lv-LV')}</p>
</div>

<div class="summary">
<div class="summary-card">
<h3>Kopā ierakstu</h3>
<p style="font-size: 24px; margin: 0;">${(logs || []).length}</p>
</div>
<div class="summary-card">
<h3>Unikāli skolēni</h3>
<p style="font-size: 24px; margin: 0;">${new Set((logs || []).map((l: LogEntry) => l.student_id)).size}</p>
</div>
<div class="summary-card">
<h3>Darbību veidi</h3>
<p style="font-size: 24px; margin: 0;">${reportData.actionStats.length}</p>
</div>
</div>

<h2>Pēdējās aktivitātes</h2>
<table>
<thead>
<tr>
<th>Datums un laiks</th>
<th>Skolēns</th>
<th>E-pasts</th>
<th>Darbība</th>
<th>Klase</th>
<th>Apraksts</th>
</tr>
</thead>
<tbody>
${(logs || []).slice(0, 20).map((log: LogEntry) => `
<tr>
<td>${log.time}</td>
<td>${log.student?.name || 'N/A'}</td>
<td>${log.student?.email || 'N/A'}</td>
<td>${log.action || 'N/A'}</td>
<td>${log.student?.class || 'N/A'}</td>
<td>${log.description || ''}</td>
</tr>
`).join('')}
</tbody>
</table>
</body>
</html>
`;

        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const getUniqueStudentsCount = (): number => {
        return new Set((logs || []).map((l: LogEntry) => l.student_id)).size;
    };

    const getTodaysEntries = (): number => {
        const today = new Date().toISOString().split('T')[0];
        return (logs || []).filter((l: LogEntry) =>
            l.action === 'entry' && (l.time || '').startsWith(today)
        ).length;
    };

    const getMostActiveStudents = (): [string, number][] => {
        const studentActivity = (logs || []).reduce<StudentActivity>((acc, log) => {
            const name = log.student?.name || 'Nezināms';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(studentActivity)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    };

    const getPeakActivityHours = (): [string, number][] => {
        const hourlyActivity = (logs || []).reduce<HourlyActivity>((acc, log) => {
            const hour = new Date(log.time).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(hourlyActivity)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([hour, count]) => [`${hour}:00 - ${hour}:59`, count]);
    };

    const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-300 rounded shadow">
                    <p className="font-semibold">{`${label}`}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.dataKey}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Aktivitāšu atskaites</h2>
                        <p className="text-gray-600 mt-1">Visaptverošas žurnāla un apmeklētības analīzes</p>
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
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            type="button"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Filters */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={20} />
                            <h3 className="text-lg font-semibold">Filtri</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sākuma datums</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Beigu datums</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sākuma laiks</label>
                                <input
                                    type="time"
                                    value={filters.startTime}
                                    onChange={(e) => handleFilterChange('startTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Beigu laiks</label>
                                <input
                                    type="time"
                                    value={filters.endTime}
                                    onChange={(e) => handleFilterChange('endTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vārds vai e-pasts</label>
                                <input
                                    type="text"
                                    value={filters.query}
                                    onChange={(e) => handleFilterChange('query', e.target.value)}
                                    placeholder="Meklēt pēc vārda vai e-pasta"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Darbība</label>
                                <select
                                    value={filters.action}
                                    onChange={(e) => handleFilterChange('action', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Visas darbības</option>
                                    <option value="login">Pieteikšanās</option>
                                    <option value="logout">Atteikšanās</option>
                                    <option value="entry">Ieeja</option>
                                    <option value="exit">Izeja</option>
                                    <option value="profile_update">Profila atjaunošana</option>
                                    <option value="user_created">Lietotājs izveidots</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={applyFilters}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-6 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Kopā ierakstu</p>
                                    <p className="text-2xl font-bold text-gray-900">{(logs || []).length}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Unikāli skolēni</p>
                                    <p className="text-2xl font-bold text-gray-900">{getUniqueStudentsCount()}</p>
                                </div>
                                <Users className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Šodienas iejas</p>
                                    <p className="text-2xl font-bold text-gray-900">{getTodaysEntries()}</p>
                                </div>
                                <Clock className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Darbību veidi</p>
                                    <p className="text-2xl font-bold text-gray-900">{reportData.actionStats.length}</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Pēdējās aktivitātes laika skala</h4>
                            <div className="space-y-4">
                                {reportData.timeline.map((log: LogEntry) => (
                                    <div key={log.id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {log.student?.name || 'Nezināms skolēns'} - {log.action || 'Nezināma darbība'}
                                                </p>
                                                <p className="text-xs text-gray-500">{log.time}</p>
                                            </div>
                                            {log.description && (
                                                <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Klase: {log.student?.class || 'N/A'} | ID: {log.student_id}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;

