import { Student } from "@/types/students";
import { Mail, Hash, GraduationCap, User } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";
import { api } from "@/utils/api";
import { toast } from "sonner";

interface StudentShowProps {
    student: Student;
    setShow: (show: boolean) => void;
    show: boolean;
}

export function StudentShow({ student, setShow, show }: StudentShowProps) {
    const [email, setEmail] = useState(student.email);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        try {
            await api.post("/students/update-student-email", {
                id: student.id,
                email,
            });

            setShow(false);
        } catch (error) {
            toast.error("Neizdevās saglabāt studenta e-pastu");
            console.error("Failed to update student email:", error);
        }
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Studenta Profils
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-4 py-4">
                    <div className="text-center space-y-1">
                        <h3 className="text-xl font-semibold">{student.name}</h3>
                        {student.status && (
                            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                                {student.status}
                            </Badge>
                        )}
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

                            <div className="flex items-center gap-3 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Vārds:</span>
                                <span className="font-medium">{student.name}</span>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Klase:</span>
                                <span className="font-medium">{student.class}</span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-muted"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="flex gap-2 pt-4 w-full">
                    <Button className="flex-1 w-full">
                        Rediģēt
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
