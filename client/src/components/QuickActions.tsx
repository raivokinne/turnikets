import { useEffect, useState } from 'react';
import { User, QrCode } from 'lucide-react';
import AddStudentForm from './AddStudentForm';
import SendQRCodeModal from './SendQRCodeModal';
import { Student } from '@/types/students';
import { studentsApi } from "@/api/students";

const QuickActions: React.FC = () => {
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showSendQRCode, setShowSendQRCode] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

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
        </div>
      </div>

      {showAddStudent && (
        <AddStudentForm
          onClose={() => setShowAddStudent(false)}
          onSubmit={handleAddStudent}
        />
      )}

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
