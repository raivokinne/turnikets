import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Student } from "@/types/students";
import { studentsApi } from "@/api/students";

interface AddEmployeeFormProps {
    onClose: () => void;
    onSubmit?: (employee: Student) => void;
}

const employeeSchema = z.object({
    name: z.string().min(1, { message: "Vārds un uzvārds ir obligāts" }),
    email: z.string().email({ message: "Lūdzu ievadiet derīgu e-pasta adresi" }),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ onClose, onSubmit }) => {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const employeeForm = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });

    const createEmployeeMutation = useMutation({
        mutationFn: (employeeData: Omit<Student, "id">) =>
            studentsApi.create(employeeData),
        onMutate: async (newEmployee) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["students"] });

            // Snapshot the previous value
            const previousStudents = queryClient.getQueryData(["students"]);

            // Create optimistic employee with temporary ID
            const optimisticEmployee: Student = {
                id: Date.now(), // Temporary ID until we get the real one from server
                ...newEmployee,
                active: true, // Default active status
            };

            // Optimistically update the cache
            queryClient.setQueryData(["students"], (old: Student[] | undefined) => {
                return old ? [...old, optimisticEmployee] : [optimisticEmployee];
            });

            // Return a context with the previous and optimistic employee
            return { previousStudents, optimisticEmployee };
        },
        onSuccess: (data: Student, variables, context) => {
            // Update the cache with the real employee data from the server
            queryClient.setQueryData(["students"], (old: Student[] | undefined) => {
                if (!old) return [data];

                // Replace the optimistic employee with the real one
                return old.map(student =>
                    student.id === context?.optimisticEmployee.id ? data : student
                );
            });

            toast.success("Darbinieks veiksmīgi pievienots!");
            onSubmit?.(data);
            onClose();
        },
        onError: (error: Error, variables, context) => {
            // Revert the optimistic update
            queryClient.setQueryData(["students"], context?.previousStudents);

            console.error("Create employee error:", error);
            const errorMessage = error.message || "Kļūda pievienojot darbinieku";
            setError(errorMessage);
            toast.error(errorMessage);
        },
        onSettled: () => {
            // Always refetch after error or success to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["students"] });
        },
    });

    const handleEmployeeSubmit = async (data: EmployeeFormValues) => {
        setError(null);

        const employeeData: Omit<Student, "id"> = {
            name: data.name,
            email: data.email,
            class: "darbinieki", // Auto-set class to "darbinieki" for employees
            status: "neviens", // Auto-set default status to "neviens" (Gaida)
            time: new Date().toISOString(),
            active: true, // Default to active
        };

        createEmployeeMutation.mutate(employeeData);
    };

    const isLoading = createEmployeeMutation.isPending;

    return (
        <div className="w-full">
            <div className="space-y-4">
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form
                    onSubmit={employeeForm.handleSubmit(handleEmployeeSubmit)}
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
                            placeholder="Ievadiet darbinieka vārdu..."
                            disabled={isLoading}
                            {...employeeForm.register("name")}
                        />
                        {employeeForm.formState.errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {employeeForm.formState.errors.name.message}
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
                            placeholder="darbinieks@skola.lv"
                            disabled={isLoading}
                            {...employeeForm.register("email")}
                        />
                        {employeeForm.formState.errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {employeeForm.formState.errors.email.message}
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
                            {createEmployeeMutation.isPending
                                ? "Pievieno..."
                                : "Pievienot darbinieku"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeForm;