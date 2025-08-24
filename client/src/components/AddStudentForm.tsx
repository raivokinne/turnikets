import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, X, User, Upload, FileSpreadsheet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Student } from "@/types/students";
import { studentsApi } from "@/api/students";
import { useAuth } from "@/providers/AuthProvider";

interface AddStudentFormProps {
    onClose: () => void;
    onSubmit?: (student: Student) => void;
}

interface UploadResponse {
    total_records?: number;
    message?: string;
}

const studentSchema = z.object({
    name: z.string().min(1, { message: "Vārds un uzvārds ir obligāts" }),
    class: z.string().min(1, { message: "Klase ir obligāta" }),
    email: z.string().email({ message: "Lūdzu ievadiet derīgu e-pasta adresi" }),
});

const excelUploadSchema = z.object({
    file: z
        .instanceof(FileList)
        .refine((files) => files.length > 0, "Lūdzu izvēlieties failu")
        .refine(
            (files) => {
                const file = files[0];
                return file && (
                    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                    file.type === "application/vnd.ms-excel" ||
                    file.name.endsWith('.xlsx') ||
                    file.name.endsWith('.xls') ||
                    file.name.endsWith('.xlsm')
                );
            },
            "Lūdzu izvēlieties derīgu Excel failu (.xlsx vai .xls)"
        )
        .refine(
            (files) => {
                const file = files[0];
                return file && file.size <= 1000 * 1024 * 1024;
            },
            "Faila izmērs nedrīkst pārsniegt 1GB"
        ),
});

type StudentFormValues = z.infer<typeof studentSchema>;
type ExcelUploadFormValues = z.infer<typeof excelUploadSchema>;

const AddStudentForm: React.FC<AddStudentFormProps> = ({ onClose, onSubmit }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'single' | 'excel'>('single');
    const [dragActive, setDragActive] = useState(false);

    const studentForm = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            name: "",
            class: "",
            email: "",
        },
    });

    const excelForm = useForm<ExcelUploadFormValues>({
        resolver: zodResolver(excelUploadSchema),
    });

    const createStudentMutation = useMutation({
        mutationFn: (studentData: Omit<Student, "id">) =>
            studentsApi.create(studentData),
        onSuccess: (data: Student) => {
            toast.success("Skolēns veiksmīgi pievienots!");
            queryClient.invalidateQueries({ queryKey: ["students"] });
            onSubmit?.(data);
            onClose();
        },
        onError: (error: Error) => {
            console.error("Create student error:", error);
            const errorMessage = error.message || "Kļūda pievienojot skolēnu";
            setError(errorMessage);
            toast.error(errorMessage);
        },
    });

    const uploadExcelMutation = useMutation({
        mutationFn: async (file: File): Promise<UploadResponse> => {
            const formData = new FormData();
            formData.append('file', file);
            if (user?.id) {
                formData.append('employee_id', user.id);
            }

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.open('POST', `${import.meta.env.VITE_PYTHON_URL}/upload/excel`, true);

                xhr.onload = function() {
                    try {
                        const response = JSON.parse(xhr.responseText) as UploadResponse;
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve(response);
                        } else {
                            const errorResponse = response as UploadResponse & { error?: string };
                            reject(new Error(errorResponse.message || errorResponse.error || xhr.responseText || `HTTP ${xhr.status}`));
                        }
                    } catch {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve({ message: xhr.responseText });
                        } else {
                            reject(new Error(xhr.responseText || `HTTP ${xhr.status}: ${xhr.statusText}`));
                        }
                    }
                };

                xhr.onerror = function() {
                    try {
                        if (xhr.responseText) {
                            const response = JSON.parse(xhr.responseText) as { message?: string };
                            reject(new Error(response.message || xhr.responseText));
                        } else {
                            reject(new Error('Tīkla kļūda - nevar sasniegt serveri'));
                        }
                    } catch {
                        reject(new Error(xhr.responseText || 'Tīkla kļūda'));
                    }
                };

                xhr.ontimeout = function() {
                    reject(new Error('Pieprasījuma taimauts'));
                };

                xhr.timeout = 30000;
                xhr.send(formData);
            });
        },
        onSuccess: (data: UploadResponse) => {
            const successMessage = data.message || `Veiksmīgi augšupielādēti ${data.total_records || 0} ieraksti!`;
            toast.success(successMessage);
            queryClient.invalidateQueries({ queryKey: ["students"] });
            onClose();
        },
        onError: (error: Error) => {
            console.error("Excel upload error:", error);
            const errorMessage = error.message || "Kļūda augšupielādējot failu";
            setError(errorMessage);
            toast.error(errorMessage);
        },
    });

    const handleStudentSubmit = async (data: StudentFormValues) => {
        setError(null);

        const studentData: Omit<Student, "id"> = {
            name: data.name,
            email: data.email,
            class: data.class,
            status: "neviens", // Auto-set default status to "neviens" (Gaida)
            time: new Date().toISOString(),
        };

        createStudentMutation.mutate(studentData);
    };

    const handleExcelSubmit = async (data: ExcelUploadFormValues) => {
        setError(null);
        const file = data.file[0];
        uploadExcelMutation.mutate(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const fileList = e.dataTransfer.files;
            excelForm.setValue("file", fileList);
        }
    };

    const selectedFile = excelForm.watch("file")?.[0];
    const isLoading = createStudentMutation.isPending || uploadExcelMutation.isPending;

    const formContent = (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab('single')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'single'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <User className="h-4 w-4" />
                    Viens skolēns
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('excel')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'excel'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <Upload className="h-4 w-4" />
                    Excel fails
                </button>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Single Student Form */}
            {activeTab === 'single' && (
                <form
                    onSubmit={studentForm.handleSubmit(handleStudentSubmit)}
                    className="space-y-4"
                >
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Vārds un uzvārds
                        </label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Ievadiet skolēna vārdu..."
                            disabled={isLoading}
                            {...studentForm.register("name")}
                        />
                        {studentForm.formState.errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {studentForm.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="class"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Klase
                        </label>
                        <Input
                            id="class"
                            type="text"
                            placeholder="Piemēram: 12B"
                            disabled={isLoading}
                            {...studentForm.register("class")}
                        />
                        {studentForm.formState.errors.class && (
                            <p className="text-red-500 text-sm mt-1">
                                {studentForm.formState.errors.class.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            E-pasts
                        </label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="skolens@skola.lv"
                            disabled={isLoading}
                            {...studentForm.register("email")}
                        />
                        {studentForm.formState.errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {studentForm.formState.errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Atcelt
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {createStudentMutation.isPending
                                ? "Pievieno..."
                                : "Pievienot skolēnu"}
                        </Button>
                    </div>
                </form>
            )}

            {/* Excel Upload Form */}
            {activeTab === 'excel' && (
                <form
                    onSubmit={excelForm.handleSubmit(handleExcelSubmit)}
                    className="space-y-4"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Excel fails
                        </label>

                        <div
                            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                dragActive
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-gray-300 hover:border-gray-400"
                            } ${isLoading ? "opacity-50" : ""}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                disabled={isLoading}
                                {...excelForm.register("file")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />

                            <div className="space-y-2">
                                {selectedFile ? (
                                    <>
                                        <FileSpreadsheet className="mx-auto h-8 w-8 text-green-500" />
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Noklikšķiniet vai ievelciet failu šeit
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Atbalstītie formāti: .xlsx, .xls (līdz 1GB)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {excelForm.formState.errors.file && (
                            <p className="text-red-500 text-sm mt-1">
                                {excelForm.formState.errors.file.message}
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            <strong>Piezīme:</strong> Excel failam jāsatur kolonnas: Vārds un uzvārds, Klase, E-pasts.
                            Pirmā rinda tiks uzskatīta par virsrakstiem. Visiem skolēniem automātiski tiks piešķirts statuss "Gaida".
                        </p>
                    </div>

                    <div className="w-full mb-2">
                        <img
                            src="./example.png"
                            alt="Faila piemērs"
                            className="rounded-xl shadow w-full h-auto object-cover"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Atcelt
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !selectedFile}
                            className="flex-1"
                        >
                            {uploadExcelMutation.isPending
                                ? "Augšupielādē..."
                                : "Augšupielādēt"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );

    return (
        <div className="w-full">
            {formContent}
        </div>
    );
};

export default AddStudentForm;