import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, X, Upload, FileSpreadsheet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

interface ExcelUploadFormProps {
    onClose: () => void;
    onSuccess?: (data: any) => void;
}

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

type ExcelUploadFormValues = z.infer<typeof excelUploadSchema>;

const ExcelUploadForm: React.FC<ExcelUploadFormProps> = ({
    onClose,
    onSuccess,
}) => {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const form = useForm<ExcelUploadFormValues>({
        resolver: zodResolver(excelUploadSchema),
    });

    const uploadExcelMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post('http://localhost:5000/upload/excel', formData, {
                method: "POST",
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status !== 200) {
                throw new Error(response.data || 'Kļūda augšupielādējot failu');
            }

            return response.data;
        },
        onSuccess: (data) => {
            toast.success(`Veiksmīgi augšupielādēti ${data.total_records || 0} ieraksti!`);
            queryClient.invalidateQueries({ queryKey: ["students"] });
            onSuccess?.(data);
            onClose();
        },
        onError: (error: Error) => {
            console.error("Excel upload error:", error);
            const errorMessage = error.message || "Kļūda augšupielādējot failu";
            setError(errorMessage);
            toast.error(errorMessage);
        },
    });

    const handleSubmit = async (data: ExcelUploadFormValues) => {
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
            form.setValue("file", fileList);
        }
    };

    const selectedFile = form.watch("file")?.[0];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Augšupielādēt Excel failu
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={uploadExcelMutation.isPending}
                        >
                            <X className="h-6 w-6" />
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Excel fails
                            </label>

                            <div
                                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-gray-300 hover:border-gray-400"
                                    } ${uploadExcelMutation.isPending ? "opacity-50" : ""}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    disabled={uploadExcelMutation.isPending}
                                    {...form.register("file")}
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

                            {form.formState.errors.file && (
                                <p className="text-red-500 text-sm mt-1">
                                    {form.formState.errors.file.message}
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700">
                                <strong>Piezīme:</strong> Excel failam jāsatur kolonnas: Vārds un uzvārds, Klase, E-pasts.
                                Pirmā rinda tiks uzskatīta par virsrakstiem.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={uploadExcelMutation.isPending}
                                className="flex-1"
                            >
                                Atcelt
                            </Button>
                            <Button
                                type="submit"
                                disabled={uploadExcelMutation.isPending || !selectedFile}
                                className="flex-1"
                            >
                                {uploadExcelMutation.isPending
                                    ? "Augšupielādē..."
                                    : "Augšupielādēt"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExcelUploadForm;
