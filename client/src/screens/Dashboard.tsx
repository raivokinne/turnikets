import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function Dashboard() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	const handleLogout = async () => {
		setIsLoading(true);
		try {
			await logout();
			navigate('/');
		} catch (error) {
			console.error('Logout error', error);
			setIsLoading(false);
		}
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

	return (
		<ProtectedRoute>
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
									<DropdownMenuItem onClick={() => navigate('/profile')}>
										<User className="mr-2 h-4 w-4" />
										<span>Profils</span>
									</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleLogout}
									disabled={isLoading}
									className={cn(isLoading && "opacity-70 cursor-not-allowed")}
								>
									<LogOut className="h-4 w-4" />
									{isLoading ? "Atteikšanās..." : "Atteikties"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				<main className="flex-grow container mx-auto px-4 py-8">
				</main>
			</div>
		</ProtectedRoute>
	);
}
