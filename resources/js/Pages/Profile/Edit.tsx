import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Camera, Shield, User } from 'lucide-react';

import type { User as UserType } from '@/types';


export default function Edit({ user }: { user: UserType } ) {
    // Inertia form for profile info
    const profileForm = useForm({
        name: user?.name || '',
        email: user?.email || '',
    });

    // Inertia form for password update (handled separately)
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

    return (
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
                                            <Button type="button" variant="outline" size="sm" disabled>
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
                                            value={profileForm.data.name}
                                            onChange={e => profileForm.setData('name', e.target.value)}
                                            disabled={profileForm.processing}
                                        />
                                        {profileForm.errors.name && (
                                            <p className="text-sm text-red-600 mt-1">{profileForm.errors.name}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">E-pasts</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={profileForm.data.email}
                                            onChange={e => profileForm.setData('email', e.target.value)}
                                            disabled={profileForm.processing}
                                        />
                                        {profileForm.errors.email && (
                                            <p className="text-sm text-red-600 mt-1">{profileForm.errors.email}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={profileForm.processing} className='mt-4'>
                                    {profileForm.processing ? "Saglabā..." : "Saglabāt"}
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
                                        value={passwordForm.data.currentPassword}
                                        onChange={e => passwordForm.setData('currentPassword', e.target.value)}
                                        disabled={passwordForm.processing}
                                    />
                                    {passwordForm.errors.currentPassword && (
                                        <p className="text-sm text-red-600 mt-1">{passwordForm.errors.currentPassword}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Jaunā parole</Label>
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        value={passwordForm.data.newPassword}
                                        onChange={e => passwordForm.setData('newPassword', e.target.value)}
                                        disabled={passwordForm.processing}
                                    />
                                    {passwordForm.errors.newPassword && (
                                        <p className="text-sm text-red-600 mt-1">{passwordForm.errors.newPassword}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Apstipriniet jauno paroli</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={passwordForm.data.confirmPassword}
                                        onChange={e => passwordForm.setData('confirmPassword', e.target.value)}
                                        disabled={passwordForm.processing}
                                    />
                                    {passwordForm.data.newPassword !== passwordForm.data.confirmPassword && passwordForm.data.confirmPassword && (
                                        <p className="text-sm text-red-600 mt-1">Paroles nesakrīt!</p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={passwordForm.processing || (passwordForm.data.newPassword !== passwordForm.data.confirmPassword)} className='mt-4'>
                                    {passwordForm.processing ? "Notiek atjaunināšana..." : "Atjaunināt paroli"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
