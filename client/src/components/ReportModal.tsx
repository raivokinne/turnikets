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
    const { logs, getAllLogsForReport, loading: hooksLoading } = useLogs();

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
    const [allDateRangeLogs, setAllDateRangeLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Apply frontend filters to logs
    const applyFrontendFilters = useCallback((logsToFilter: LogEntry[]) => {
        let filtered = [...logsToFilter];

        // Filter by time range if specified
        if (filters.startTime !== '00:00' || filters.endTime !== '23:59') {
            filtered = filtered.filter(l => {
                if (!l.time) return false;

                try {
                    // Parse ISO date string and convert to Latvian timezone
                    const logDate = new Date(l.time);
                    const logTime = logDate.toLocaleTimeString('en-GB', {
                        timeZone: 'Europe/Riga',
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

    // Build report from given logs
    const buildReportFromLogs = useCallback((logsToUse: LogEntry[]) => {
        if (!logsToUse || !logsToUse.length) {
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

        const attendanceByDate = logsToUse
            .filter((log: LogEntry) => ['entry', 'exit'].includes(log.action || ''))
            .reduce<AttendanceAccumulator>((acc, log) => {
                // Convert to Latvian timezone and extract date
                const date = new Date(log.time || '').toLocaleDateString('en-CA', { timeZone: 'Europe/Riga' }); // YYYY-MM-DD format
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

        const actionStats = logsToUse.reduce<ActionAccumulator>((acc, log) => {
            const action = log.action || 'unknown';
            if (!acc[action]) acc[action] = 0;
            acc[action]++;
            return acc;
        }, {});

        // Process class statistics
        interface ClassAccumulator {
            [className: string]: number;
        }

        const classStats = logsToUse
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
            timeline: logsToUse.slice(0, 10)
        });
    }, []);

    // Apply filters whenever allDateRangeLogs or filter criteria change
    useEffect(() => {
        if (allDateRangeLogs && allDateRangeLogs.length > 0) {
            const filtered = applyFrontendFilters(allDateRangeLogs);
            setFilteredLogs(filtered);
            buildReportFromLogs(filtered);
        } else {
            setFilteredLogs([]);
            buildReportFromLogs([]);
        }
    }, [allDateRangeLogs, applyFrontendFilters, buildReportFromLogs]);

    const handleFilterChange = (key: keyof FilterState, value: string): void => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = async (): Promise<void> => {
        setLoading(true);
        try {
            // Fetch ALL logs for the date range (not just 50)
            const allLogs = await getAllLogsForReport(filters.startDate, filters.endDate);
            setAllDateRangeLogs(allLogs);
        } catch (error) {
            console.error('Error applying filters:', error);
            setAllDateRangeLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Load initial data when modal opens
    useEffect(() => {
        if (isOpen) {
            applyFilters();
        }
    }, [isOpen]);

    const formatDateTime = (dateTimeString: string) => {
        if (!dateTimeString) return { date: 'N/A', time: 'N/A' };

        try {
            const date = new Date(dateTimeString);
            const localDate = date.toLocaleDateString('lv-LV', { timeZone: 'Europe/Riga' }); // Latvian format with Riga timezone
            const localTime = date.toLocaleTimeString('lv-LV', {
                timeZone: 'Europe/Riga',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            return { date: localDate, time: localTime };
        } catch (error) {
            return { date: 'N/A', time: 'N/A' };
        }
    };

    const formatDateForPDF = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('lv-LV', { timeZone: 'Europe/Riga' });
        } catch (error) {
            return dateString;
        }
    };

    const getCurrentDateTimeInLatvia = () => {
        const now = new Date();
        const date = now.toLocaleDateString('lv-LV', { timeZone: 'Europe/Riga' });
        const time = now.toLocaleTimeString('lv-LV', {
            timeZone: 'Europe/Riga',
            hour: '2-digit',
            minute: '2-digit'
        });
        return { date, time };
    };

    const exportToPDF = (): void => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Generate date range for the header using Latvian timezone
        const startDateFormatted = formatDateForPDF(filters.startDate);
        const endDateFormatted = formatDateForPDF(filters.endDate);
        const dateRange = filters.startDate === filters.endDate
            ? startDateFormatted
            : `${startDateFormatted} - ${endDateFormatted}`;

        const currentDateTime = getCurrentDateTimeInLatvia();

        const printContent = `
<!DOCTYPE html>
<html>
<head>
<title>Aktivitāšu atskaite</title>
<style>
body { 
    font-family: Arial, sans-serif; 
    margin: 20px; 
    font-size: 12px;
    line-height: 1.4;
}
.header { 
    text-align: center; 
    margin-bottom: 30px; 
    border-bottom: 2px solid #333;
    padding-bottom: 15px;
}
.header h1 {
    margin: 0 0 10px 0;
    font-size: 24px;
    color: #333;
}
.header .subtitle {
    font-size: 14px;
    color: #666;
    margin: 5px 0;
}
.summary { 
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 25px;
    border: 1px solid #dee2e6;
}
.summary h3 {
    margin-top: 0;
    color: #495057;
    font-size: 16px;
}
table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-bottom: 20px; 
    font-size: 11px;
}
th, td { 
    padding: 8px 6px; 
    text-align: left; 
    border: 1px solid #dee2e6; 
    vertical-align: top;
}
th { 
    background-color: #f8f9fa; 
    font-weight: bold;
    color: #495057;
}
tr:nth-child(even) {
    background-color: #f8f9fa;
}
.description-cell {
    max-width: 200px;
    word-wrap: break-word;
    font-style: italic;
    color: #6c757d;
}
.student-name {
    font-weight: bold;
}
.action-entry { color: #28a745; }
.action-exit { color: #dc3545; }
.group-cell { font-weight: bold; color: #007bff; }
@media print {
    body { margin: 15px; font-size: 10px; }
    .header h1 { font-size: 20px; }
    table { font-size: 9px; }
    th, td { padding: 4px; }
}
</style>
</head>
<body>

<div class="header">
    <h1>Aktivitāšu atskaite</h1>
    <div class="subtitle">Periods: ${dateRange}</div>
    <div class="subtitle">Kopā ierakstu: ${filteredLogs.length}</div>
    <div class="subtitle">Ģenerēts: ${currentDateTime.date} ${currentDateTime.time} (Latvijas laiks)</div>
</div>

<div class="summary">
    <h3>Atskaites kopsavilkums</h3>
    <p><strong>Datumu diapazons:</strong> ${dateRange}</p>
    <p><strong>Laika diapazons:</strong> ${filters.startTime} - ${filters.endTime}</p>
    ${filters.query ? `<p><strong>Meklēšanas vaicājums:</strong> ${filters.query}</p>` : ''}
    ${filters.action ? `<p><strong>Darbības filtrs:</strong> ${filters.action === 'entry' ? 'Ieeja' : filters.action === 'exit' ? 'Izeja' : filters.action}</p>` : ''}
    ${filters.class ? `<p><strong>Grupas filtrs:</strong> ${filters.class}</p>` : ''}
</div>

<h2>Aktivitātes</h2>
<table>
<thead>
<tr>
<th style="width: 12%;">Datums</th>
<th style="width: 8%;">Laiks</th>
<th style="width: 20%;">Skolēns</th>
<th style="width: 12%;">Grupa</th>
<th style="width: 10%;">Darbība</th>
<th style="width: 38%;">Apraksts</th>
</tr>
</thead>
<tbody>
${filteredLogs.map((log: LogEntry) => {
            const { date, time } = formatDateTime(log.time || '');
            const actionText = log.action === 'entry' ? 'Ieeja' : log.action === 'exit' ? 'Izeja' : log.action || 'N/A';
            const actionClass = log.action === 'entry' ? 'action-entry' : log.action === 'exit' ? 'action-exit' : '';
            const studentName = log.student?.name || 'N/A';
            const studentClass = log.student?.class || 'N/A';
            const description = log.description || '';

            return `
<tr>
<td>${date}</td>
<td>${time}</td>
<td class="student-name">${studentName}</td>
<td class="group-cell">${studentClass}</td>
<td class="${actionClass}">${actionText}</td>
<td class="description-cell">${description}</td>
</tr>
`;
        }).join('')}
</tbody>
</table>

${filteredLogs.length === 0 ? '<div style="text-align: center; padding: 20px; color: #6c757d;"><p>Nav atrasti ieraksti ar norādītajiem filtriem</p></div>' : ''}

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
                                    disabled={loading || hooksLoading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                    type="button"
                                >
                                    {(loading || hooksLoading) ? (
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
                                <p className="text-xs text-gray-500 mt-1">No {allDateRangeLogs.length} ierakstiem datumu diapazonā</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Pēdējās aktivitātes</h4>
                        {reportData.timeline.length > 0 ? (
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
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Nav atrasti ieraksti ar norādītajiem filtriem</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReportModal;