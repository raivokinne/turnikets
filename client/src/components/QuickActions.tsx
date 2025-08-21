import { useEffect, useState } from 'react';
import { User, QrCode, BookPlus, DoorOpen, ToggleLeft, ToggleRight, Wifi, WifiOff } from 'lucide-react';
import AddStudentForm from './AddStudentForm';
import SendQRCodeModal from './SendQRCodeModal';
import { Student } from '@/types/students';
import { studentsApi } from "@/api/students";
import { gatesApi } from "@/api/gates";
import ReportModal from './ReportModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GateState {
    isOpen: boolean;
    isOnline: boolean;
}

const QuickActions: React.FC = () => {
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [showSendQRCode, setShowSendQRCode] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [gateStates, setGateStates] = useState<{ [key: number]: GateState }>({
        1: { isOpen: false, isOnline: false },
        2: { isOpen: false, isOnline: false }
    });
    const [isLoadingGates, setIsLoadingGates] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const resp = await studentsApi.getAll();
                setStudents(resp);
            } catch (error) {
                console.error('Failed to fetch attendance data:', error);
                setStudents([]);
            }
        }
        fetchData();
    }, []);

    // Fetch gate states on mount
    useEffect(() => {
        fetchGateStates();
    }, []);

    // Set up interval to fetch gate states every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchGateStates();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const fetchGateStates = async () => {
        try {
            const states = await gatesApi.getAllGateStates();
            setGateStates(states);
        } catch (error) {
            console.error('Failed to fetch gate states:', error);
            setGateStates({
                1: { isOpen: false, isOnline: false },
                2: { isOpen: false, isOnline: false }
            });
        }
    };

    const handleAddStudent = (student: Student) => {
        const newStudent = {
            id: Math.random(),
            name: student.name,
            class: student.class,
            email: student.email,
            time: student.time,
            status: student.status
        };

        setStudents([...students, newStudent]);
        console.log('New student added:', newStudent);
    };

    const handleSendQRCodes = () => {
        setShowSendQRCode(true);
    };

    const handleShowReport = () => {
        setShowReport(true);
    };

    const handleOpenGate = async (gateNumber: number) => {
        if (!gateStates[gateNumber]?.isOnline) {
            console.warn(`Gate ${gateNumber} is offline`);
            return;
        }

        setIsLoadingGates(true);
        try {
            await gatesApi.openGate(gateNumber);
            console.log(`Gate ${gateNumber} opened for 5 seconds`);
            // Refresh gate states after operation
            setTimeout(() => {
                fetchGateStates();
            }, 1000);
        } catch (error) {
            console.error(`Failed to open gate ${gateNumber}:`, error);
        } finally {
            setIsLoadingGates(false);
        }
    };

    const handleToggleGate = async (gateNumber: number) => {
        if (!gateStates[gateNumber]?.isOnline) {
            console.warn(`Gate ${gateNumber} is offline`);
            return;
        }

        setIsLoadingGates(true);
        try {
            await gatesApi.toggleGate(gateNumber);
            console.log(`Gate ${gateNumber} toggled`);

            // Update local state immediately for better UX
            setGateStates(prev => ({
                ...prev,
                [gateNumber]: {
                    ...prev[gateNumber],
                    isOpen: !prev[gateNumber].isOpen
                }
            }));

            // Refresh gate states after a delay
            setTimeout(() => {
                fetchGateStates();
                setIsLoadingGates(false);
            }, 1000);
        } catch (error) {
            console.error(`Failed to toggle gate ${gateNumber}:`, error);
            // Refresh states on error to get accurate data
            await fetchGateStates();
            setIsLoadingGates(false);
        }
    };

    const onClose = () => {
        setShowReport(false);
    };

    const getGateStatusColor = (isOpen: boolean) => isOpen ? 'bg-green-500' : 'bg-red-500';
    const getGateStatusText = (isOpen: boolean) => isOpen ? 'Atvērts' : 'Aizvērts';
    const getConnectionStatusColor = (isOnline: boolean) => isOnline ? 'bg-green-500' : 'bg-red-500';
    const getConnectionStatusText = (isOnline: boolean) => isOnline ? 'Tiešsaistē' : 'Bezsaistē';

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Ātrās darbības
                </h2>
                <div className="space-y-4">
                    <button
                        className="w-full flex items-center justify-start p-4 bg-black hover:bg-gray-800 text-white rounded-lg text-lg font-medium transition-colors"
                        onClick={() => setShowAddStudent(true)}
                    >
                        <User className="mr-3 h-6 w-6" />
                        Pievienot jaunu skolēnu
                    </button>

                    <button
                        className="w-full flex items-center justify-start p-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-lg font-medium transition-colors border border-gray-300"
                        onClick={handleSendQRCodes}
                    >
                        <QrCode className="mr-3 h-6 w-6" />
                        Nosūtīt QR kodus pa e-pastu
                    </button>

                    <button
                        className="w-full flex items-center justify-start p-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-lg font-medium transition-colors border border-gray-300"
                        onClick={handleShowReport}
                    >
                        <BookPlus className="mr-3 h-6 w-6" />
                        Atskaite
                    </button>

                    {/* Gate Controls */}
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Vārtu vadība</h3>

                        {/* Gate 1 Controls */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Vārti 1</span>
                                <div className="flex items-center space-x-4">
                                    {/* Connection Status */}
                                    <div className="flex items-center space-x-2">
                                        {gateStates[1]?.isOnline ? (
                                            <Wifi className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <WifiOff className="w-4 h-4 text-red-600" />
                                        )}
                                        <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(gateStates[1]?.isOnline)}`}></div>
                                        <span className="text-xs text-gray-600">{getConnectionStatusText(gateStates[1]?.isOnline)}</span>
                                    </div>

                                    {/* Gate Status */}
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${getGateStatusColor(gateStates[1]?.isOpen)}`}></div>
                                        <span className="text-xs text-gray-600">{getGateStatusText(gateStates[1]?.isOpen)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    className={`flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${
                                        gateStates[1]?.isOnline
                                            ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300'
                                            : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    }`}
                                    onClick={() => handleOpenGate(1)}
                                    disabled={isLoadingGates || !gateStates[1]?.isOnline}
                                    title={!gateStates[1]?.isOnline ? "Vārti nav pieejami" : ""}
                                >
                                    <DoorOpen className="mr-2 h-4 w-4" />
                                    Atvērt
                                </button>

                                <button
                                    className={`flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${
                                        gateStates[1]?.isOnline
                                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300'
                                            : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    }`}
                                    onClick={() => handleToggleGate(1)}
                                    disabled={isLoadingGates || !gateStates[1]?.isOnline}
                                    title={!gateStates[1]?.isOnline ? "Vārti nav pieejami" : ""}
                                >
                                    {gateStates[1]?.isOpen ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
                                    Pārslēgt
                                </button>
                            </div>
                        </div>

                        {/* Gate 2 Controls */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Vārti 2</span>
                                <div className="flex items-center space-x-4">
                                    {/* Connection Status */}
                                    <div className="flex items-center space-x-2">
                                        {gateStates[2]?.isOnline ? (
                                            <Wifi className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <WifiOff className="w-4 h-4 text-red-600" />
                                        )}
                                        <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(gateStates[2]?.isOnline)}`}></div>
                                        <span className="text-xs text-gray-600">{getConnectionStatusText(gateStates[2]?.isOnline)}</span>
                                    </div>

                                    {/* Gate Status */}
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${getGateStatusColor(gateStates[2]?.isOpen)}`}></div>
                                        <span className="text-xs text-gray-600">{getGateStatusText(gateStates[2]?.isOpen)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    className={`flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${
                                        gateStates[2]?.isOnline
                                            ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300'
                                            : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    }`}
                                    onClick={() => handleOpenGate(2)}
                                    disabled={isLoadingGates || !gateStates[2]?.isOnline}
                                    title={!gateStates[2]?.isOnline ? "Vārti nav pieejami" : ""}
                                >
                                    <DoorOpen className="mr-2 h-4 w-4" />
                                    Atvērt
                                </button>

                                <button
                                    className={`flex items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${
                                        gateStates[2]?.isOnline
                                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300'
                                            : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                    }`}
                                    onClick={() => handleToggleGate(2)}
                                    disabled={isLoadingGates || !gateStates[2]?.isOnline}
                                    title={!gateStates[2]?.isOnline ? "Vārti nav pieejami" : ""}
                                >
                                    {gateStates[2]?.isOpen ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
                                    Pārslēgt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={showReport}
                onClose={onClose}
            />

            <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pievienot skolēnus</DialogTitle>
                    </DialogHeader>
                    <div className="p-2">
                        <AddStudentForm
                            onClose={() => setShowAddStudent(false)}
                            onSubmit={handleAddStudent}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {showSendQRCode && (
                <SendQRCodeModal
                    onClose={() => setShowSendQRCode(false)}
                    students={students}
                />
            )}
        </>
    );
};

export default QuickActions;