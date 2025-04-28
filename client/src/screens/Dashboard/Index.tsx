import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	const handleLogout = async () => {
		setIsLoading(true);
		try {
			await logout();
			navigate('/login');
		} catch (error) {
			console.error('Logout error', error);
			setIsLoading(false);
		}
	};

	return (
		<ProtectedRoute>
			<div className="flex flex-col min-h-screen bg-gray-50">
				<header className="bg-white shadow py-4 px-6">
					<div className="max-w-7xl mx-auto flex justify-between items-center">
						<h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
						<Button
							variant="outline"
							onClick={handleLogout}
							disabled={isLoading}
							className="flex items-center gap-2"
						>
							<LogOut className="h-4 w-4" />
							{isLoading ? "Logging out..." : "Logout"}
						</Button>
					</div>
				</header>

				<main className="flex-grow container mx-auto px-4 py-8">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-xl">Welcome Back</CardTitle>
								<CardDescription>
									Your account information
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-center py-6">
									<div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary/10">
										<User className="h-12 w-12 text-primary" />
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-500">Name:</span>
										<span className="text-sm font-semibold">{user?.name}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-500">Email:</span>
										<span className="text-sm font-semibold">{user?.email}</span>
									</div>
									<div className="flex justify-between">
										<span className="text-sm font-medium text-gray-500">Account ID:</span>
										<span className="text-sm font-semibold">{user?.id}</span>
									</div>
								</div>
							</CardContent>
							<CardFooter>
								<Button variant="outline" className="w-full">
									Edit Profile
								</Button>
							</CardFooter>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Account Activity</CardTitle>
								<CardDescription>Recent activities on your account</CardDescription>
							</CardHeader>
							<CardContent className="h-40 flex items-center justify-center">
								<p className="text-gray-500 text-center">No recent activity</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>Things you can do</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2">
								<Button variant="outline" className="w-full">View Settings</Button>
								<Button variant="outline" className="w-full">Manage Notifications</Button>
								<Button variant="outline" className="w-full">Change Password</Button>
							</CardContent>
						</Card>
					</div>
				</main>

				<footer className="bg-white border-t py-4 px-6">
					<div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
						© {new Date().getFullYear()} Your Application. All rights reserved.
					</div>
				</footer>
			</div>
		</ProtectedRoute>
	);
}
