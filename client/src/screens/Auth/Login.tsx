import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
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
            console.log('Login successful');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login. Please check your credentials and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Pieteikties</CardTitle>
                    <CardDescription className="text-center">
                        Ievadiet savu e-pastu un paroli, lai piekļūtu savam kontam
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                E-pasts
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                {...form.register('email')}
                                disabled={isLoading}
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Parole
                            </label>
                            <Input
                                id="password"
                                type="password"
                                {...form.register('password')}
                                disabled={isLoading}
                            />
                            {form.formState.errors.password && (
                                <p className="text-sm text-red-600">
                                    {form.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Notiek Pieteikšanās..." : "Pieteikties"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}