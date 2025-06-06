import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import EmployeeManagement from '@/components/EmployeeManagement';
import StudentDashboard from '@/components/StudentDashboard';
import type { User } from '@/types';
import { Link, router } from '@inertiajs/react';

export default function Dashboard({ user }: { user: User }) {
    const [isLoading, setIsLoading] = useState(false);
    const isAdmin = user.role === 'admin' ? true : false

    const handleLogout = () => {
        setIsLoading(true);
        router.post('/logout');
    };

    const getUserInitials = () => {
        if (!user || !user.name) return 'L';
        return user.name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const goToProfile = () => {
        router.get(route('profile'));
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow px-4">
                    <div className="flex justify-between items-center">
                        <div className="p-4 border-b">
                            <Link href="/dashboard" className="text-2xl font-bold text-gray-900">Panelis</Link>
                        </div>

                        <div className="flex items-center space-x-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="relative h-8 w-8 rounded-full focus-visible:ring-offset-0"
                                    >
                                        <Avatar className="h-8 w-8 border transition-all hover:scale-105">
                                            <AvatarImage src={user?.avatar} alt={user?.name || 'Lietotājs'} />
                                            <AvatarFallback className="bg-primary/10">
                                                {getUserInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="sr-only">Atvērt lietotāja izvēlni</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.name || 'Lietotājs'}</p>
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {user?.email || 'lietotajs@example.com'}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem onClick={goToProfile}>
                                            <UserIcon className="mr-2 h-4 w-4" />
                                            <span>Profils</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        disabled={isLoading}
                                        className={cn(isLoading && "opacity-70 cursor-not-allowed")}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>{isLoading ? "Notiek izrakstīšanās..." : "Izrakstīties"}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {isAdmin ? (
                        <EmployeeManagement />
                    ) : (
                        <StudentDashboard />
                    )}
                </main>
            </div>
        </div>
    );
};
