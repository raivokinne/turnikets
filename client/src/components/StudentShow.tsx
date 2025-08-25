import { Student } from "@/types/students";
import { Mail, Hash, GraduationCap, User, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState, useEffect } from "react";
import { api } from "@/utils/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface StudentShowProps {
    student: Student;
    setShow: (show: boolean) => void;
    show: boolean;
    onStudentUpdate?: (student: Student) => void;
    onOptimisticUpdate?: (student: Student) => void;
    isUpdating?: boolean;
}

export function StudentShow({
                                student,
                                setShow,
                                show,
                                onStudentUpdate,
                                onOptimisticUpdate,
                                isUpdating = false
                            }: StudentShowProps) {
    const [email, setEmail] = useState(student.email);
    const [name, setName] = useState(student.name);
    const [studentClass, setStudentClass] = useState(student.class);
    const [active, setActive] = useState(student.active ?? true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const queryClient = useQueryClient();

    // Update local state when student prop changes (for real-time updates)
    useEffect(() => {
        setEmail(student.email);
        setName(student.name);
        setStudentClass(student.class);
        setActive(student.active ?? true);
    }, [student]);

    // Handle input changes with optimistic updates
    const handleNameChange = (value: string) => {
        setName(value);
        if (onOptimisticUpdate) {
            onOptimisticUpdate({
                ...student,
                name: value
            });
        }
    };

    const handleClassChange = (value: string) => {
        setStudentClass(value);
        if (onOptimisticUpdate) {
            onOptimisticUpdate({
                ...student,
                class: value
            });
        }
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (onOptimisticUpdate) {
            onOptimisticUpdate({
                ...student,
                email: value
            });
        }
    };

    const handleActiveToggle = () => {
        const newActive = !active;
        setActive(newActive);
        if (onOptimisticUpdate) {
            onOptimisticUpdate({
                ...student,
                active: newActive
            });
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const updatedStudent: Student = {
            ...student,
            email,
            name,
            class: studentClass,
            active,
        };

        try {
            await api.post("/students/update-profile", {
                id: student.id,
                email: email,
                name: name,
                class: studentClass,
                active: active,
            });

            // Update the cache
            queryClient.setQueryData(["students"], (oldStudents: Student[] | undefined) => {
                if (!oldStudents) return [updatedStudent];
                return oldStudents.map(s =>
                    s.id === student.id ? updatedStudent : s
                );
            });

            // Call the update handler if provided (for parent component updates)
            if (onStudentUpdate) {
                onStudentUpdate(updatedStudent);
            }

            toast.success("Studenta dati saglabāti");
            setShow(false);
        } catch (error) {
            toast.error("Neizdevās saglabāt studenta datus");
            console.error("Failed to update student data:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            await api.post("/students/destroy", {
                _method: "DELETE",
                id: student.id,
            });

            // Remove from cache
            queryClient.setQueryData(["students"], (oldStudents: Student[] | undefined) => {
                if (!oldStudents) return [];
                return oldStudents.filter(s => s.id !== student.id);
            });

            toast.success("Students dzēsts");
            setConfirmOpen(false);
            setShow(false);
        } catch (error) {
            toast.error("Neizdevās dzēst studentu");
            console.error("Failed to delete student:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const hasChanges = () => {
        return email !== student.email ||
            name !== student.name ||
            studentClass !== student.class ||
            active !== (student.active ?? true);
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Studenta Profils
                        </div>

                        {/* Active Toggle in top right */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {active ? 'Aktīvs' : 'Neaktīvs'}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleActiveToggle}
                                disabled={isUpdating || isSaving}
                                className="p-1 h-auto"
                            >
                                {active ? (
                                    <ToggleRight className="h-6 w-6 text-green-600" />
                                ) : (
                                    <ToggleLeft className="h-6 w-6 text-gray-400" />
                                )}
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-xl font-semibold">{name || student.name}</h3>
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant={active ? "default" : "secondary"} className="text-xs">
                                {active ? 'Aktīvs' : 'Neaktīvs'}
                            </Badge>
                            {hasChanges() && (
                                <Badge variant="secondary" className="text-xs">
                                    Nesaglabātas izmaiņas
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Student Details */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">ID:</span>
                                <span className="font-medium">{student.id}</span>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-medium flex items-center gap-2"
                                >
                                    <User className="h-4 w-4" />
                                    Vārds
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    className="bg-muted"
                                    disabled={isUpdating || isSaving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="class"
                                    className="text-sm font-medium flex items-center gap-2"
                                >
                                    <GraduationCap className="h-4 w-4" />
                                    Klase
                                </Label>
                                <Input
                                    id="class"
                                    type="text"
                                    value={studentClass}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    className="bg-muted"
                                    disabled={isUpdating || isSaving}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-medium flex items-center gap-2"
                                >
                                    <Mail className="h-4 w-4" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    className="bg-muted"
                                    disabled={isUpdating || isSaving}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-4">
                    <form onSubmit={handleSubmit} className="flex gap-2 pt-4 w-full">
                        <Button
                            className="flex-1 w-full"
                            disabled={isUpdating || isSaving || !hasChanges()}
                            type="submit"
                        >
                            {(isUpdating || isSaving) ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saglabā...
                                </>
                            ) : (
                                'Saglabāt'
                            )}
                        </Button>
                    </form>
                    <div className="flex gap-2 pt-4 w-full">
                        <Button
                            type="button"
                            variant="destructive"
                            className="flex-1 w-full"
                            onClick={() => setConfirmOpen(true)}
                            disabled={isUpdating || isSaving || isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Dzēš...
                                </>
                            ) : (
                                'Dzēst'
                            )}
                        </Button>
                    </div>
                </div>

                {/* Confirm Delete Dialog */}
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent className="sm:max-w-md" showCloseButton={false}>
                        <DialogHeader>
                            <DialogTitle>Apstiprināt dzēšanu</DialogTitle>
                        </DialogHeader>
                        <p>
                            Vai tiešām vēlaties dzēst studentu <strong>{student.name}</strong>?
                            Šī darbība nav atgriezeniska.
                        </p>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setConfirmOpen(false)}
                                disabled={isDeleting}
                            >
                                Atcelt
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Dzēš...
                                    </>
                                ) : (
                                    'Dzēst'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}