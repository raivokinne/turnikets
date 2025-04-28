import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Camera, Shield, User } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Edit() {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: user?.name || '',
		email: user?.email || '',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleProfileUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await new Promise(resolve => setTimeout(resolve, 1000));
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordUpdate = async (e: React.FormEvent) => {
		e.preventDefault();

		if (formData.newPassword !== formData.confirmPassword) {
			return;
		}

		setIsLoading(true);

		try {
			await new Promise(resolve => setTimeout(resolve, 1000));

			setFormData(prev => ({
				...prev,
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			}));
		} catch (error) {
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ProtectedRoute>
			<div className="container max-w-4xl mx-auto px-4 py-8">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold">Profila iestatījumi</h1>
						<p className="text-muted-foreground mt-1">
							Pārvaldiet sava konta iestatījumus
						</p>
					</div>
					<Avatar className="h-16 w-16">
						<AvatarImage src={user?.avatar} alt={user?.name} />
						<AvatarFallback className="bg-primary/10 text-xl">
							{user?.name?.charAt(0).toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</div>

				<Tabs defaultValue="general" className="space-y-6">
					<TabsList className="bg-muted w-full justify-start rounded-none border-b h-12 space-x-4 px-4">
						<TabsTrigger value="general" className="data-[state=active]:bg-background">
							<User className="h-4 w-4 mr-2" />
							Vispārēji
						</TabsTrigger>
						<TabsTrigger value="security" className="data-[state=active]:bg-background">
							<Shield className="h-4 w-4 mr-2" />
							Drošiba
						</TabsTrigger>
					</TabsList>

					<TabsContent value="general">
						<Card>
							<CardHeader>
								<CardTitle>Vispārēja informācija</CardTitle>
								<CardDescription>
									Atjauniniet sava profila informāciju
								</CardDescription>
							</CardHeader>
							<form onSubmit={handleProfileUpdate}>
								<CardContent className="space-y-6">
									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="avatar">Profila Attēls</Label>
											<div className="flex items-center space-x-4">
												<Avatar className="h-24 w-24">
													<AvatarImage src={user?.avatar} alt={user?.name} />
													<AvatarFallback className="bg-primary/10 text-2xl">
														{user?.name?.charAt(0).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<Button type="button" variant="outline" size="sm">
													<Camera className="h-4 w-4 mr-2" />
													Nomainīt Attēlu
												</Button>
											</div>
										</div>
										<Separator />
										<div className="space-y-2">
											<Label htmlFor="name">Vārds</Label>
											<Input
												id="name"
												name="name"
												value={formData.name}
												onChange={handleInputChange}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">E-pasts</Label>
											<Input
												id="email"
												name="email"
												type="email"
												value={formData.email}
												onChange={handleInputChange}
											/>
										</div>
									</div>
								</CardContent>
								<CardFooter>
									<Button type="submit" disabled={isLoading} className='mt-4'>
										{isLoading ? "Saglabā..." : "Saglabāt"}
									</Button>
								</CardFooter>
							</form>
						</Card>
					</TabsContent>

					<TabsContent value="security">
						<Card>
							<CardHeader>
								<CardTitle>Parole</CardTitle>
								<CardDescription>
									Nomainīt savu paroli
								</CardDescription>
							</CardHeader>
							<form onSubmit={handlePasswordUpdate}>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="currentPassword">Pašreizējā parole</Label>
										<Input
											id="currentPassword"
											name="currentPassword"
											type="password"
											value={formData.currentPassword}
											onChange={handleInputChange}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="newPassword">Jaunā parole</Label>
										<Input
											id="newPassword"
											name="newPassword"
											type="password"
											value={formData.newPassword}
											onChange={handleInputChange}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="confirmPassword">Apstipriniet jauno paroli</Label>
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type="password"
											value={formData.confirmPassword}
											onChange={handleInputChange}
										/>
									</div>
								</CardContent>
								<CardFooter>
									<Button type="submit" disabled={isLoading} className='mt-4'>
										{isLoading ? "Notiek atjaunināšana..." : "Atjaunināt paroli"}
									</Button>
								</CardFooter>
							</form>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</ProtectedRoute>
	);
}
