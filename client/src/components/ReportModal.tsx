import React, { useEffect, useState } from 'react';
import { User, QrCode, BookPlus, X, Calendar, Download, FileText, Users, Clock, Filter, BarChart3, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { LogEntry } from '@/types/logs';
import { useLogs } from '@/hooks/useLogs';

interface FilterState {
    startDate: string;
    endDate: string;
    studentId: string;
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
    const { logs, getLogsByDateRange, getLogsByStudent } = useLogs();

    const [filters, setFilters] = useState<FilterState>({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        studentId: '',
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

    useEffect(() => {
        generateReport();
    }, [logs]);

    const generateReport = (): void => {
        if (!logs.length) return;

        interface AttendanceAccumulator {
            [date: string]: {
                date: string;
                entries: number;
                exits: number;
            };
        }

        const attendanceByDate = logs
            .filter((log: LogEntry) => ['entry', 'exit'].includes(log.action || ''))
            .reduce<AttendanceAccumulator>((acc, log) => {
                const date = log.time.split(' ')[0];
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

        const actionStats = logs.reduce<ActionAccumulator>((acc, log) => {
            const action = log.action || 'unknown';
            if (!acc[action]) acc[action] = 0;
            acc[action]++;
            return acc;
        }, {});

        // Process class statistics
        interface ClassAccumulator {
            [className: string]: number;
        }

        const classStats = logs
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
            timeline: logs.slice(0, 10)
        });
    };

    const handleFilterChange = (key: keyof FilterState, value: string): void => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = async (): Promise<void> => {
        setLoading(true);
        try {
            if (filters.startDate && filters.endDate) {
                await getLogsByDateRange(filters.startDate, filters.endDate);
            } else if (filters.studentId) {
                await getLogsByStudent(parseInt(filters.studentId));
            }
        } catch (error) {
            console.error('Error applying filters:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (): void => {
        const headers: string[] = ['Date', 'Time', 'Student ID', 'Student Name', 'Action', 'Class', 'Description'];
        const csvData = [
            headers.join(','),
            ...logs.map((log: LogEntry) => [
                log.time.split(' ')[0],
                log.time.split(' ')[1] || '',
                log.student_id.toString(),
                log.student?.name || 'N/A',
                log.action || 'N/A',
                log.student?.class || 'N/A',
                log.description || ''
            ].map((field: string) => `"${field}"`).join(','))
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
          <div class="header">
            <h1>Aktivitāšu žurnāla atskaite</h1>
            <p>Periods: ${filters.startDate} līdz ${filters.endDate}</p>
            <p>Izveidots: ${new Date().toLocaleString('lv-LV')}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Kopā ierakstu</h3>
              <p style="font-size: 24px; margin: 0;">${logs.length}</p>
            </div>
            <div class="summary-card">
              <h3>Unikāli skolēni</h3>
              <p style="font-size: 24px; margin: 0;">${new Set(logs.map((l: LogEntry) => l.student_id)).size}</p>
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
                <th>Darbība</th>
                <th>Klase</th>
                <th>Apraksts</th>
              </tr>
            </thead>
            <tbody>
              ${logs.slice(0, 20).map((log: LogEntry) => `
                <tr>
                  <td>${log.time}</td>
                  <td>${log.student?.name || 'N/A'}</td>
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
        return new Set(logs.map((l: LogEntry) => l.student_id)).size;
    };

    const getTodaysEntries = (): number => {
        const today = new Date().toISOString().split('T')[0];
        return logs.filter((l: LogEntry) =>
            l.action === 'entry' && l.time.startsWith(today)
        ).length;
    };

    const getMostActiveStudents = (): [string, number][] => {
        const studentActivity = logs.reduce<StudentActivity>((acc, log) => {
            const name = log.student?.name || 'Nezināms';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(studentActivity)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    };

    const getPeakActivityHours = (): [string, number][] => {
        const hourlyActivity = logs.reduce<HourlyActivity>((acc, log) => {
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
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={20} />
                            <h3 className="text-lg font-semibold">Filtri</h3>
                        </div>
                        <div className="grid gap-4">
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
