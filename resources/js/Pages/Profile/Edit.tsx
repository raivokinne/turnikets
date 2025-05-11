import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Upload, Loader2 } from 'lucide-react';
import type { User as UserType } from '@/types';

export default function Edit({ user }: { user: UserType }) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const back = () => {
        window.history.back();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return;
        }

        setIsUploading(true);
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
                            <AvatarImage src={user.avatar} alt={user?.name} />
                            <AvatarFallback className="bg-primary/10 text-2xl font-medium">
                                {user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute -bottom-2 -right-2 rounded-full p-1 h-8 w-8"
                            onClick={triggerFileInput}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                        </Button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                        />
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
