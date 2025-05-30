import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Search, Edit, Trash2, Mail } from 'lucide-react';

const EmployeeManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const employees = [
    { id: 1, name: "Jānis Bērziņš", email: "janis.berzins@school.lv", role: "Skolotājs", department: "Matemātika" },
    { id: 2, name: "Līga Kalniņa", email: "liga.kalnina@school.lv", role: "Administrators", department: "Birojs" },
    { id: 3, name: "Andris Liepiņš", email: "andris.liepins@school.lv", role: "Skolotājs", department: "Fizika" },
    { id: 4, name: "Anna Ozoliņa", email: "anna.ozolina@school.lv", role: "Psihologs", department: "Atbalsta personāls" },
    { id: 5, name: "Māris Zariņš", email: "maris.zarins@school.lv", role: "IT atbalsts", department: "IT" },
  ];

  const filteredEmployees = searchQuery
    ? employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : employees;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Darbinieku pārvaldība</h1>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Pievienot darbinieku
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Darbinieku saraksts</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Meklēt darbiniekus..."
                  className="pl-8 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vārds</TableHead>
                <TableHead>E-pasts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between border-t px-6 py-3">
          <p className="text-xs text-gray-500">Rāda {filteredEmployees.length} no {employees.length} darbiniekiem</p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Iepriekšējie</Button>
            <Button variant="outline" size="sm" disabled>Nākamie</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmployeeManagement;

