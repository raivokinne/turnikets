import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Camera, Shield, User, ArrowLeft, Mail, Upload } from 'lucide-react';
import AuthRoute from '@/components/AuthRoute';

export default function Edit() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: user?.name || '',
		email: user?.email || '',
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const back = () => {
		navigate(-1);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsLoading(true);
		try {
			const previewUrl = URL.createObjectURL(file);

			await new Promise(resolve => setTimeout(resolve, 1000));

			console.log('File selected:', file.name);
			console.log('Preview URL:', previewUrl);

			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (error) {
			console.error('Error updating avatar:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const handleProfileUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			await new Promise(resolve => setTimeout(resolve, 1000));

			console.log('Updating profile with:', {
				name: formData.name,
				email: formData.email,
			});
		} catch (error) {
			console.error('Error updating profile:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordUpdate = async (e: React.FormEvent) => {
		e.preventDefault();

		if (formData.newPassword !== formData.confirmPassword) {
			console.error('Passwords do not match');
			return;
		}

		if (formData.newPassword.length < 6) {
			console.error('Password must be at least 6 characters');
			return;
		}

		setIsLoading(true);

		try {
			await new Promise(resolve => setTimeout(resolve, 1000));

			console.log('Updating password');

			setFormData(prev => ({
				...prev,
				currentPassword: '',
				newPassword: '',
				confirmPassword: '',
			}));
		} catch (error) {
			console.error('Error updating password:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthRoute>
			<div className="container max-w-4xl mx-auto px-4 py-8 bg-gray-50/50 min-h-screen">
				<div className="mb-8">
					<Button
						onClick={back}
						variant="ghost"
						className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Atpakaļ
					</Button>
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
						<div className="relative group">
							<Avatar className="h-20 w-20">
								<AvatarImage src={user?.avatar} alt={user?.name} />
								<AvatarFallback className="bg-primary/10 text-2xl font-medium">
									{user?.name?.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<input
								type="file"
								ref={fileInputRef}
								className="hidden"
								accept="image/jpeg,image/png,image/gif,image/webp"
								onChange={handleFileChange}
								disabled={isLoading}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="absolute -bottom-2 -right-2 rounded-full p-1 h-8 w-8"
								onClick={triggerFileInput}
								disabled={isLoading}
							>
								<Upload className="h-4 w-4" />
							</Button>
						</div>
						<div className="flex-1">
							<h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
							<div className="flex items-center mt-1 text-gray-500">
								<Mail className="h-4 w-4 mr-2" />
								<span>{user?.email}</span>
							</div>
						</div>
						<Badge variant="outline" className="bg-primary/5 text-primary px-3 py-1">
							Lietotājs
						</Badge>
					</div>
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
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={triggerFileInput}
													disabled={isLoading}
												>
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
												disabled={isLoading}
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
												disabled={isLoading}
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
											disabled={isLoading}
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
											disabled={isLoading}
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
											disabled={isLoading}
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
		</AuthRoute>
	);
}
