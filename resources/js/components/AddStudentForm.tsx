import { X } from 'lucide-react';
import { Student } from '@/types/students';
import { router, useForm } from '@inertiajs/react';

interface AddStudentFormProps {
    onClose: () => void;
    onSubmit: (student: Student) => void;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose }) => {
    const { post, errors, setData } = useForm({
        name: '',
        class: '',
        email: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('students.store'));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vārds un uzvārds
                            </label>
                            <input
                                type="text"
                                required
                                onChange={(e) => setData('name', e.target.value)}
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
                                onChange={(e) => setData('class', e.target.value)}
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
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full h-12 px-4 border border-gray-300 rounded-lg"
                                placeholder="skolens@skola.lv"
                            />
                        </div>

                        {errors.name && (
                            <p className="text-red-500 text-sm mt-2">{errors.name}</p>
                        )}
                        {errors.studentClass && (
                            <p className="text-red-500 text-sm mt-2">{errors.studentClass}</p>
                        )}
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
                        >
                            Pievienot skolēnu
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default AddStudentForm;
