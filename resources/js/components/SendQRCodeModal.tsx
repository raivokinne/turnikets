
import { X, Search, Send, QrCode, Info, Check } from 'lucide-react';
import QRService from './QRService';
import { useEffect, useState } from 'react';
import { Student } from '@/types/students';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

interface SendQRCodeModalProps {
  onClose: () => void;
  students: Student[];
}

const SendQRCodeModal: React.FC<SendQRCodeModalProps> = ({ onClose, students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [sendingStatus, setSendingStatus] = useState<{ [key: string]: 'idle' | 'sending' | 'sent' | 'failed' }>({});
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const [showQRPreview, setShowQRPreview] = useState<{student: Student, url: string} | null>(null);

  useEffect(() => {
    setFilteredStudents(
      students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, students]);

  const toggleStudentSelection = (student: Student) => {
    if (selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  const selectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents([...filteredStudents]);
    }
  };

  const previewQRCode = (student: Student) => {
    const qrData = QRService.generateQRCodeData(student.id, student.name, student.class);
    const url = QRService.generateQRCodeUrl(qrData);
    setShowQRPreview({ student, url });
  };

  const sendQRCode = async (student: Student) => {
    setSendingStatus(prev => ({ ...prev, [student.id]: 'sending' }));

    try {
      toast.promise(
        QRService.sendQRCodeToStudent(student.name, student.class, student.email, student.id),
        {
          loading: `Sūta QR kodu ${student.name}...`,
          success: (success) => {
            if (success) {
              setSendingStatus(prev => ({ ...prev, [student.id]: 'sent' }));
              return `QR kods nosūtīts ${student.name}`;
            } else {
              setSendingStatus(prev => ({ ...prev, [student.id]: 'failed' }));
              return `Neizdevās nosūtīt QR kodu ${student.name}`;
            }
          },
          error: (error) => {
            console.error(`Failed to send QR code to ${student.name}:`, error);
            setSendingStatus(prev => ({ ...prev, [student.id]: 'failed' }));
            return `Kļūda nosūtot QR kodu ${student.name}`;
          }
        }
      );
    } catch (error) {
      console.error(`Failed to send QR code to ${student.name}:`, error);
      setSendingStatus(prev => ({ ...prev, [student.id]: 'failed' }));
    }
  };

  const sendAllSelected = async () => {
    if (selectedStudents.length === 0) return;

    toast.info(`Sūta QR kodus ${selectedStudents.length} atlasītajiem skolēniem`);

    for (const student of selectedStudents) {
      await sendQRCode(student);
    }

    toast.success(`QR kodi nosūtīti ${selectedStudents.length} skolēniem`);
  };

  const getStatusBadge = (status: 'idle' | 'sending' | 'sent' | 'failed') => {
    switch (status) {
      case 'idle':
        return <Badge variant="outline" className="bg-slate-50">Gatavs</Badge>;
      case 'sending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Sūta...</Badge>;
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Nosūtīts</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Kļūda</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-50">Gatavs</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
      <Card className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Nosūtīt QR kodus skolēniem</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Meklēt skolēnu pēc vārda, klases vai e-pasta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border-slate-200 rounded-lg focus:border-blue-300 focus:ring focus:ring-blue-100"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={selectAll}
                className="whitespace-nowrap"
              >
                {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0
                  ? 'Noņemt visus'
                  : 'Atlasīt visus'}
              </Button>
              <Button
                variant="default"
                onClick={sendAllSelected}
                disabled={selectedStudents.length === 0}
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Nosūtīt ({selectedStudents.length})
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-grow scrollbar-thin">
          <table className="w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="sr-only">Atlasīt</span>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Vārds Uzvārds
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Klase
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  E-pasts
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Statuss
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Darbības
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-slate-300" />
                      <p className="text-slate-500">Nav atrasts neviens skolēns</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedStudents.some(s => s.id === student.id);
                  return (
                    <tr key={student.id} className={cn(
                      "transition-colors",
                      isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                    )}>
                      <td className="pl-6 pr-3 py-4 whitespace-nowrap w-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStudentSelection(student)}
                          className="h-5 w-5 rounded data-[state=checked]:bg-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700">{student.class}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sendingStatus[student.id] || 'idle')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => previewQRCode(student)}
                          className="inline-flex items-center bg-white hover:bg-slate-50"
                        >
                          <Info className="h-4 w-4 mr-1" />
                          Skatīt
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendQRCode(student)}
                          disabled={sendingStatus[student.id] === 'sending'}
                          className={cn(
                            "inline-flex items-center",
                            sendingStatus[student.id] === 'sent'
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-white hover:bg-slate-50"
                          )}
                        >
                          {sendingStatus[student.id] === 'sent' ? (
                            <>
                              <Check className="h-4 w-4 mr-1 text-green-600" />
                              Nosūtīts
                            </>
                          ) : (
                            <>
                              <QrCode className="h-4 w-4 mr-1" />
                              {sendingStatus[student.id] === 'sending' ? 'Sūta...' : 'Nosūtīt'}
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* QR Code Preview Modal */}
      {showQRPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] transition-all duration-300">
          <Card className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-slate-800">QR kods</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowQRPreview(null)} className="rounded-full hover:bg-slate-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="text-center">
              <div className="bg-white p-4 rounded-xl shadow-md inline-block mb-4">
                <img src={showQRPreview.url} alt="QR kods" className="mx-auto h-48 w-48" />
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium text-slate-800 mb-1">
                  {showQRPreview.student.name}
                </h4>
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                    {showQRPreview.student.class}
                  </Badge>
                  <span className="text-sm">{showQRPreview.student.email}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Open in new tab to print
                    const printWindow = window.open(showQRPreview.url, '_blank');
                    if (printWindow) {
                      printWindow.addEventListener('load', () => {
                        printWindow.print();
                      });
                    }
                  }}
                  className="w-full bg-white hover:bg-slate-50 border-slate-200"
                >
                  Izdrukāt QR kodu
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    sendQRCode(showQRPreview.student);
                    setShowQRPreview(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Nosūtīt QR kodu pa e-pastu
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SendQRCodeModal;
