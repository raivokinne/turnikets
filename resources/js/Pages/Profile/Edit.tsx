import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Upload } from 'lucide-react';
import type { User as UserType } from '@/types';
import { router } from '@inertiajs/react';

export default function Edit({ user }: { user: UserType }) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const back = () => {
        window.history.back();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('email', user.email);
        formData.append('_method', 'PATCH');

        router.post("/profile", formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
            onError: (errors) => {
                console.error('Error updating avatar:', errors);
            }
        });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

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
                    <div className="relative group">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={"http://localhost:8000/storage/" + user.avatar} alt={user?.name} />
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
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute -bottom-2 -right-2 rounded-full p-1 h-8 w-8"
                            onClick={triggerFileInput}
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
        </div>
    );
}
