import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuthRoute from '@/components/AuthRoute';

const loginSchema = z.object({
	email: z.string().email({ message: 'Please enter a valid email address' }),
	password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const onSubmit = async (data: LoginFormValues) => {
		setIsLoading(true);
		setError(null);

		try {
			await login(data);
			navigate("/dashboard");
		} catch (err) {
			setError('Failed to login. Please check your credentials and try again.');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthRoute>
			<div className="flex items-center justify-center min-h-screen bg-gray-50">
				<div className="w-full max-w-md">
					<Card>
						<CardHeader className="space-y-1">
							<CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
							<CardDescription className="text-center">
								Enter your email and password to access your account
							</CardDescription>
						</CardHeader>
						<CardContent>
							{error && (
								<Alert variant="destructive" className="mb-4">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Form {...form}>
								<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														placeholder="email@example.com"
														type="email"
														autoComplete="email"
														disabled={isLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input
														placeholder="••••••••"
														type="password"
														autoComplete="current-password"
														disabled={isLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<Button
										type="submit"
										className="w-full"
										disabled={isLoading}
									>
										{isLoading ? "Logging in..." : "Login"}
									</Button>
								</form>
							</Form>
						</CardContent>
						<CardFooter className="flex flex-col space-y-2">
							<div className="text-sm text-center text-gray-500">
								Don't have an account?{" "}
								<Link to="/register" className="text-primary hover:underline">
									Register
								</Link>
							</div>
							<div className="text-sm text-center">
								<Link to="/forgot-password" className="text-gray-500 hover:text-primary hover:underline">
									Forgot your password?
								</Link>
							</div>
						</CardFooter>
					</Card>
				</div>
			</div>
		</AuthRoute>
	);
}
