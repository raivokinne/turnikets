import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, X, User, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Student } from "@/types/students";
import { studentsApi } from "@/api/students";
import ExcelUploadForm from "./ExcelUploadForm";

interface AddStudentFormProps {
    onClose: () => void;
    onSubmit?: (student: Student) => void;
}

const studentSchema = z.object({
    name: z.string().min(1, { message: "Vārds un uzvārds ir obligāts" }),
    class: z.string().min(1, { message: "Klase ir obligāta" }),
    email: z.string().email({ message: "Lūdzu ievadiet derīgu e-pasta adresi" }),
    status: z.string().optional(),
    time: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

const AddStudentForm: React.FC<AddStudentFormProps> = (
    { onClose, onSubmit },
) => {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'single' | 'excel'>('single');

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            name: "",
            class: "",
            email: "",
            status: "active",
            time: new Date().toISOString(),
        },
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

    const handleSubmit = async (data: StudentFormValues) => {
        setError(null);

        const studentData: Omit<Student, "id"> = {
            name: data.name,
            email: data.email,
            class: data.class,
            status: data.status || "klātbutne",
            time: data.time || new Date().toISOString(),
        };

        createStudentMutation.mutate(studentData);
    };

    const handleExcelSuccess = (data: any) => {
        toast.success(`Veiksmīgi augšupielādēti ${data.total_records || 0} skolēni!`);
        onClose();
    };

    if (activeTab === 'excel') {
        return (
            <ExcelUploadForm
                onClose={onClose}
                onSuccess={handleExcelSuccess}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Pievienot skolēnus
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={createStudentMutation.isPending}
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('single')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'single'
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
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'excel'
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

                    <form
                        onSubmit={form.handleSubmit(handleSubmit)}
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
                                disabled={createStudentMutation.isPending}
                                {...form.register("name")}
                            />
                            {form.formState.errors.name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {form.formState.errors.name.message}
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
                                disabled={createStudentMutation.isPending}
                                {...form.register("class")}
                            />
                            {form.formState.errors.class && (
                                <p className="text-red-500 text-sm mt-1">
                                    {form.formState.errors.class.message}
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
                                disabled={createStudentMutation.isPending}
                                {...form.register("email")}
                            />
                            {form.formState.errors.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="status"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Statuss
                            </label>
                            <select
                                id="status"
                                disabled={createStudentMutation.isPending}
                                {...form.register("status")}
                                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white"
                            >
                                <option value="klātbutne">Klātbutne</option>
                                <option value="prombutnē">Prombutnē</option>
                                <option value="gaida">Gaida</option>
                            </select>
                            {form.formState.errors.status && (
                                <p className="text-red-500 text-sm mt-1">
                                    {form.formState.errors.status.message}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={createStudentMutation.isPending}
                                className="flex-1"
                            >
                                Atcelt
                            </Button>
                            <Button
                                type="submit"
                                disabled={createStudentMutation.isPending}
                                className="flex-1"
                            >
                                {createStudentMutation.isPending
                                    ? "Pievieno..."
                                    : "Pievienot skolēnu"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddStudentForm;
