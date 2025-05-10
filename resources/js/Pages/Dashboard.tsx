import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User as UserIcon, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import type { User } from '@/types';
import { router } from "@inertiajs/react";

export default function Dashboard({ user }: { user: User }) {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = () => {
        setIsLoading(true);
        router.post('/logout');
    };

    const getUserInitials = () => {
        if (!user || !user.name) return 'U';
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
        <div className="flex flex-col min-h-screen bg-gray-50">
            <header className="bg-white shadow py-4 px-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Panelis</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative h-8 w-8 rounded-full focus-visible:ring-offset-0"
                            >
                                <Avatar className="h-8 w-8 border transition-all hover:scale-105">
                                    <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                                    <AvatarFallback className="bg-primary/10">
                                        {getUserInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Open user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email || 'user@example.com'}
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
                                <span>{isLoading ? "Atteikšanās..." : "Atteikties"}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name}!</h2>
                    <p>You are now logged in to the application.</p>
                </div>
            </main>
        </div>
    );
}
