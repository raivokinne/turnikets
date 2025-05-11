import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Shield,
  User,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  Mail,
  UserCircle
} from 'lucide-react';

import type { User as UserType } from '@/types';

export default function Edit({ user }: { user: UserType }) {
    const profileForm = useForm({
        name: user?.name || '',
        email: user?.email || '',
    });

    const passwordForm = useForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileUpdate = (e: any) => {
        e.preventDefault();
        profileForm.post('/profile/update', {
            preserveScroll: true,
        });
    };

    const handlePasswordUpdate = (e: any) => {
        e.preventDefault();
        if (passwordForm.data.newPassword !== passwordForm.data.confirmPassword) return;
        passwordForm.post('/profile/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const back = () => {
        window.history.back();
    };

    const passwordsMatch = passwordForm.data.newPassword === passwordForm.data.confirmPassword;
    const showPasswordMismatch = !passwordsMatch && passwordForm.data.confirmPassword;

    const isPasswordValid = passwordForm.data.newPassword.length >= 8;
    const showPasswordStrength = passwordForm.data.newPassword.length > 0;

    return (
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
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-primary/10 text-2xl font-medium">
                            {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

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

            <div className="grid md:grid-cols-[240px_1fr] gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 h-fit">
                    <h2 className="font-medium text-lg mb-4 px-2">Profila iestatījumi</h2>
                    <Tabs defaultValue="general" orientation="vertical" className="w-full">
                        <TabsList className="bg-transparent flex flex-col h-auto items-stretch space-y-1 p-0">
                            <TabsTrigger value="general" className="justify-start px-2 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
                                <UserCircle className="h-5 w-5 mr-3" />
                                Vispārēji
                            </TabsTrigger>
                            <TabsTrigger value="security" className="justify-start px-2 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
                                <Shield className="h-5 w-5 mr-3" />
                                Drošiba
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div>
                    <Tabs defaultValue="general" className="space-y-6">
                        <TabsContent value="general">
                            <Card className="border-gray-100 shadow-sm">
                                <CardHeader className="bg-gray-50/70 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <UserCircle className="h-5 w-5 text-primary" />
                                        <CardTitle>Vispārēja informācija</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Atjauniniet sava profila informāciju
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handleProfileUpdate}>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="space-y-4">
                                            <div className="space-y-3">
                                                <Label htmlFor="avatar" className="text-sm font-medium">Profila Attēls</Label>
                                                <div className="flex items-center space-x-4">
                                                    <div className="relative group">
                                                        <Avatar className="h-24 w-24 border-4 border-gray-100">
                                                            <AvatarImage src={user?.avatar} alt={user?.name} />
                                                            <AvatarFallback className="bg-primary/10 text-2xl">
                                                                {user?.name?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                            <Camera className="h-6 w-6 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Button type="button" variant="outline" size="sm" className="text-sm">
                                                            <Camera className="h-4 w-4 mr-2" />
                                                            Augšupielādēt attēlu
                                                        </Button>
                                                        <p className="text-xs text-gray-500">
                                                            Pieņemti formāti: JPG, PNG. Maksimālais izmērs: 2MB
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name" className="text-sm font-medium">Vārds</Label>
                                                    <div className="relative">
                                                        <User className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                                                        <Input
                                                            id="name"
                                                            name="name"
                                                            value={profileForm.data.name}
                                                            onChange={e => profileForm.setData('name', e.target.value)}
                                                            disabled={profileForm.processing}
                                                            className="pl-10"
                                                        />
                                                    </div>
                                                    {profileForm.errors.name && (
                                                        <p className="text-sm text-red-600 mt-1 flex items-center">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            {profileForm.errors.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-sm font-medium">E-pasts</Label>
                                                    <div className="relative">
                                                        <Mail className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                                                        <Input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            value={profileForm.data.email}
                                                            onChange={e => profileForm.setData('email', e.target.value)}
                                                            disabled={profileForm.processing}
                                                            className="pl-10"
                                                        />
                                                    </div>
                                                    {profileForm.errors.email && (
                                                        <p className="text-sm text-red-600 mt-1 flex items-center">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            {profileForm.errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-gray-50/70 border-t border-gray-100 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={profileForm.processing}
                                            className="px-6"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {profileForm.processing ? "Saglabā..." : "Saglabāt"}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security">
                            <Card className="border-gray-100 shadow-sm">
                                <CardHeader className="bg-gray-50/70 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-primary" />
                                        <CardTitle>Parole</CardTitle>
                                    </div>
                                    <CardDescription>
                                        Nomainīt savu paroli
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={handlePasswordUpdate}>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="currentPassword" className="text-sm font-medium">Pašreizējā parole</Label>
                                            <div className="relative">
                                                <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                                                <Input
                                                    id="currentPassword"
                                                    name="currentPassword"
                                                    type="password"
                                                    value={passwordForm.data.currentPassword}
                                                    onChange={e => passwordForm.setData('currentPassword', e.target.value)}
                                                    disabled={passwordForm.processing}
                                                    className="pl-10"
                                                />
                                            </div>
                                            {passwordForm.errors.currentPassword && (
                                                <p className="text-sm text-red-600 mt-1 flex items-center">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    {passwordForm.errors.currentPassword}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword" className="text-sm font-medium">Jaunā parole</Label>
                                            <div className="relative">
                                                <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                                                <Input
                                                    id="newPassword"
                                                    name="newPassword"
                                                    type="password"
                                                    value={passwordForm.data.newPassword}
                                                    onChange={e => passwordForm.setData('newPassword', e.target.value)}
                                                    disabled={passwordForm.processing}
                                                    className="pl-10"
                                                />
                                            </div>
                                            {passwordForm.errors.newPassword && (
                                                <p className="text-sm text-red-600 mt-1 flex items-center">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    {passwordForm.errors.newPassword}
                                                </p>
                                            )}
                                            {showPasswordStrength && (
                                                <div className="mt-2">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`h-1 flex-1 rounded-full ${isPasswordValid ? 'bg-green-500' : 'bg-red-300'}`}></div>
                                                        <div className={`h-1 flex-1 rounded-full ${isPasswordValid ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                        <div className={`h-1 flex-1 rounded-full ${isPasswordValid && passwordForm.data.newPassword.length >= 10 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                                    </div>
                                                    <p className={`text-xs mt-1 ${isPasswordValid ? 'text-green-600' : 'text-gray-500'}`}>
                                                        Parolei jābūt vismaz 8 simbolu garai
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-sm font-medium">Apstipriniet jauno paroli</Label>
                                            <div className="relative">
                                                <Lock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                                                <Input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type="password"
                                                    value={passwordForm.data.confirmPassword}
                                                    onChange={e => passwordForm.setData('confirmPassword', e.target.value)}
                                                    disabled={passwordForm.processing}
                                                    className="pl-10"
                                                />
                                            </div>
                                            {showPasswordMismatch ? (
                                                <p className="text-sm text-red-600 mt-1 flex items-center">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Paroles nesakrīt!
                                                </p>
                                            ) : passwordForm.data.confirmPassword && (
                                                <p className="text-sm text-green-600 mt-1 flex items-center">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Paroles sakrīt
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="bg-gray-50/70 border-t border-gray-100 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={
                                                passwordForm.processing ||
                                                !passwordsMatch ||
                                                !passwordForm.data.currentPassword ||
                                                !isPasswordValid
                                            }
                                            className="px-6"
                                        >
                                            <Lock className="h-4 w-4 mr-2" />
                                            {passwordForm.processing ? "Notiek atjaunināšana..." : "Atjaunināt paroli"}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
