import { Student } from "@/types/students";
import { Mail, Hash, GraduationCap, User } from "lucide-react";
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
  const [name, setName] = useState(student.name);
  const [stundentClass, setStundentClass] = useState(student.class);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await api.post("/students/update-profile", {
        id: student.id,
        email: email,
        name: name,
        class: stundentClass,
      });

      setShow(false);
    } catch (error) {
      toast.error("Neizdevās saglabāt studenta datus");
      console.error("Failed to update student data:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.post("/students/destroy", {
        _method: "DELETE",
        id: student.id,
      });

      setConfirmOpen(false);
      setShow(false);
    } catch (error) {
      toast.error("Neizdevās izdēst studentu");
      console.error("Neizdevās izdēst studentu:", error);
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
                  htmlFor="class"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Vārds
                </Label>
                <Input
                  id="class"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted"
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
                  value={stundentClass}
                  onChange={(e) => setStundentClass(e.target.value)}
                  className="bg-muted"
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <form onSubmit={handleSubmit} className="flex gap-2 pt-4 w-full">
            <Button className="flex-1 w-full">Saglabāt</Button>
          </form>
          <div className="flex gap-2 pt-4 w-full">
            <Button
              type="button"
              variant="destructive"
              className="flex-1 w-full"
              onClick={() => setConfirmOpen(true)}
            >
              Dzēst
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
              Vai tiešām vēlaties dzēst šo studentu? Šī darbība nav
              atgriezeniska.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
              >
                Atcelt
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Dzēst
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
