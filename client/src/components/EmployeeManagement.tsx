import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, Edit, Trash2, Mail, Calendar, User, Activity, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { usersApi } from "@/api/users.ts";
import { logsApi } from "@/api/logs.ts";
import { UserType, CreateUserData, UpdateUserData} from "@/types/users.ts";
import { LogEntry } from "@/types/logs.ts";
import AddStudentForm from './AddStudentForm';

interface UserSearchParams {
    page: number;
    per_page: number;
    role?: 'admin' | 'employee';
    search?: string;
}

const UserForm: React.FC<{
    isEdit: boolean;
    formData: CreateUserData;
    setFormData: React.Dispatch<React.SetStateAction<CreateUserData>>;
    onSubmit: () => void;
    onCancel: () => void;
}> = ({ isEdit, formData, setFormData, onSubmit, onCancel }) => {
    const handleInputChange = (field: keyof CreateUserData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                    Vārds
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="col-span-3"
                    placeholder="Ievadiet vārdu"
                />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                    E-pasts
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="col-span-3"
                    placeholder="Ievadiet e-pastu"
                />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                    Loma
                </Label>
                <Select value={formData.role} onValueChange={(value: 'admin' | 'employee') => handleInputChange('role', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Izvēlieties lomu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="employee">Darbinieks</SelectItem>
                        <SelectItem value="admin">Administrators</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                    {isEdit ? 'Jauna parole' : 'Parole'}
                </Label>
                <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="col-span-3"
                    placeholder={isEdit ? 'Atstājiet tukšu, ja nevēlaties mainīt' : 'Ievadiet paroli'}
                />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password_confirmation" className="text-right">
                    Apstiprināt paroli
                </Label>
                <Input
                    id="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                    className="col-span-3"
                    placeholder="Atkārtojiet paroli"
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={onCancel}>
                    Atcelt
                </Button>
                <Button onClick={onSubmit}>
                    {isEdit ? 'Saglabāt izmaiņas' : 'Pievienot darbinieku'}
                </Button>
            </div>
        </div>
    );
};

const EmployeeManagement: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [users, setUsers] = useState<UserType[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [logsLoading, setLogsLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
    const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [selectedRole, setSelectedRole] = useState<'admin' | 'employee' | ''>('');

    // Form state
    const [formData, setFormData] = useState<CreateUserData>({
        name: '',
        email: '',
        role: 'employee',
        class: '',
        password: '',
        password_confirmation: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchLogs();
    }, [currentPage, selectedRole, searchQuery]);

    const fetchUsers = async (): Promise<void> => {
        try {
            setLoading(true);
            const params: UserSearchParams = {
                page: currentPage,
                per_page: 10,
            };

            if (selectedRole) params.role = selectedRole;
            if (searchQuery) params.search = searchQuery;

            const response = await usersApi.getPaginatedUsers(params);
            setUsers(response.data);
            setTotalPages(response.pagination.last_page);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (): Promise<void> => {
        try {
            setLogsLoading(true);
            const logsData = await logsApi.getLogs();
            setLogs(logsData);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            setLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const handleCreateUser = async (): Promise<void> => {
        try {
            await usersApi.createUser(formData);
            setIsCreateDialogOpen(false);
            resetForm();
            await fetchUsers();
        } catch (error) {
            console.error('Failed to create user:', error);
        }
    };

    const handleEditUser = async (): Promise<void> => {
        if (!editingUser) return;
        try {
            const updateData: UpdateUserData = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                class: formData.class || undefined,
            };

            // Only include password fields if password is actually provided
            if (formData.password && formData.password.trim() !== '') {
                updateData.password = formData.password;
                updateData.password_confirmation = formData.password_confirmation;
            }

            await usersApi.updateUser(editingUser.id, updateData);
            setIsEditDialogOpen(false);
            setEditingUser(null);
            resetForm();
            await fetchUsers();
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleDeleteUser = async (userId: number): Promise<void> => {
        if (window.confirm('Vai tiešām vēlaties dzēst šo darbinieku?')) {
            try {
                await usersApi.deleteUser(userId);
                await fetchUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
            }
        }
    };

    const openEditDialog = (user: UserType): void => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            class: user.class || '',
            password: '',
            password_confirmation: ''
        });
        setIsEditDialogOpen(true);
    };

    const resetForm = (): void => {
        setFormData({
            name: '',
            email: '',
            role: 'employee',
            class: '',
            password: '',
            password_confirmation: ''
        });
    };

    const formatDateTime = (dateString: string): string => {
        return new Date(dateString).toLocaleString('lv-LV', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Darbinieku pārvaldība</h1>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => setIsAddStudentDialogOpen(true)}
                        variant="outline"
                    >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Pievienot skolēnu
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Pievienot darbinieku
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Pievienot jaunu darbinieku</DialogTitle>
                            </DialogHeader>
                            <UserForm
                                isEdit={false}
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleCreateUser}
                                onCancel={() => setIsCreateDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="users" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users">Darbinieki</TabsTrigger>
                    <TabsTrigger value="logs">Aktivitātes žurnāls</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Darbinieku saraksts</CardTitle>
                                <div className="flex space-x-2">
                                    <Select
                                        value={selectedRole || 'all'}
                                        onValueChange={(value: string) => {
                                            setSelectedRole(value === 'all' ? '' : value as 'admin' | 'employee');
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Visas lomas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Visas lomas</SelectItem>
                                            <SelectItem value="admin">Administrators</SelectItem>
                                            <SelectItem value="employee">Darbinieks</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Meklēt darbiniekus..."
                                            className="pl-8 w-64"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Ielādē...</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Vārds</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">E-pasts</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Loma</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Izveidots</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-700">Darbības</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {users.map((user) => (
                                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span>{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">{user.email}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                        {user.role === 'admin' ? 'Administrators' : 'Darbinieks'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-500">
                                                    {formatDateTime(user.created_at)}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="ghost" size="sm">
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(user)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t px-6 py-3">
                            <p className="text-xs text-gray-500">
                                Rāda {users.length} darbiniekus
                            </p>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                    Iepriekšējie
                                </Button>
                                <span className="flex items-center px-3 text-sm">
                  {currentPage} / {totalPages}
                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                >
                                    Nākamie
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Activity className="h-5 w-5" />
                                <span>Aktivitātes žurnāls</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {logsLoading ? (
                                <div className="text-center py-8">Ielādē žurnālu...</div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Nav pieejamu ierakstu</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Datums un laiks</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Skolēns</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Darbība</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Apraksts</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Darbinieks</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {logs.slice(0, 50).map((log) => (
                                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-sm">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        <span>{formatDateTime(log.time)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.student ? (
                                                        <div className="flex items-center space-x-2">
                                                            <User className="h-3 w-3 text-blue-400" />
                                                            <span className="font-medium">{log.student.name}</span>
                                                            {log.student.class && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {log.student.class}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {log.action ? (
                                                        <Badge variant={log.action.includes('ienāca') ? 'default' : 'secondary'}>
                                                            {log.action}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 max-w-xs truncate text-sm text-gray-600">
                                                    {log.description || '-'}
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    {log.performed_by_user ? (
                                                        <div className="flex items-center space-x-2">
                                                            <User className="h-3 w-3 text-green-500" />
                                                            <span className="text-gray-700 font-medium">{log.performed_by_user.name}</span>
                                                            {log.performed_by_user.role && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    {log.performed_by_user.role === 'admin' ? 'Admin' : 'Darbinieks'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">Nav norādīts</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t px-6 py-3">
                            <p className="text-xs text-gray-500">
                                Rāda pēdējos {Math.min(50, logs.length)} ierakstus no {logs.length} kopējiem
                            </p>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Rediģēt darbinieku</DialogTitle>
                    </DialogHeader>
                    <UserForm
                        isEdit={true}
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleEditUser}
                        onCancel={() => setIsEditDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Pievienot skolēnus</DialogTitle>
                    </DialogHeader>
                    <div className="p-2">
                        <AddStudentForm
                            onClose={() => setIsAddStudentDialogOpen(false)}
                            onSubmit={() => {
                                setIsAddStudentDialogOpen(false);
                                // Optionally refresh logs after student is added
                                fetchLogs();
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeManagement;