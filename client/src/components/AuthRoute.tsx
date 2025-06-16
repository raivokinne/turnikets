import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { storage } from '@/utils/storage';

type AuthRouteProps = {
  children: ReactNode;
};

export default function AuthRoute({ children }: AuthRouteProps) {
  const isLoading = !storage.get<string>("token");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!storage.get<string>("token")) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

