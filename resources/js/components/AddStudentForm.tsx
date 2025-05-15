import React, { useState } from 'react';
import { X } from 'lucide-react';
import QRService from './QRService';
import { Student } from '@/types/students';

interface AddStudentFormProps {
  onClose: () => void;
  onSubmit: (student: Student) => void;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [email, setEmail] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [studentId, setStudentId] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tempId = Math.random();
    setStudentId(tempId);

    onSubmit({ id: studentId, name, class: studentClass, email, status: "", time: "" });

    const qrData = QRService.generateQRCodeData(tempId, name, studentClass);
    const url = QRService.generateQRCodeUrl(qrData);
    setQrCodeUrl(url);

    setShowQR(true);
  };

  const handleSendEmail = async () => {
    try {
      const success = await QRService.sendQRCodeToStudent(
        name,
        studentClass,
        email,
        studentId
      );

      if (success) {
        alert(`QR kods veiksmīgi nosūtīts uz e-pastu: ${email}`);
      } else {
        alert('Kļūda, nosūtot QR kodu. Lūdzu, mēģiniet vēlreiz.');
      }
    } catch (error) {
      console.error('Error sending QR code:', error);
      alert('Kļūda, nosūtot QR kodu. Lūdzu, mēģiniet vēlreiz.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {showQR ? 'Skolēna QR kods' : 'Pievienot jaunu skolēnu'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {!showQR ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vārds un uzvārds
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg"
                  placeholder="Ievadiet skolēna vārdu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Klase
                </label>
                <input
                  type="text"
                  required
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg"
                  placeholder="Piemēram: 12B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-pasts
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg"
                  placeholder="skolens@skola.lv"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
              >
                Pievienot skolēnu
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <img src={qrCodeUrl} alt="QR kods" className="mx-auto" />
              </div>
              <p className="text-gray-600 mb-2">
                QR kods skolēnam: {name} ({studentClass})
              </p>
              <p className="text-gray-600 mb-6">
                E-pasts: {email}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const printWindow = window.open(qrCodeUrl, '_blank');
                    if (printWindow) {
                      printWindow.addEventListener('load', () => {
                        printWindow.print();
                      });
                    }
                  }}
                  className="w-full bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 transition-colors"
                >
                  Izdrukāt QR kodu
                </button>
                <button
                  onClick={handleSendEmail}
                  className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
                >
                  Nosūtīt QR kodu pa e-pastu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStudentForm;
