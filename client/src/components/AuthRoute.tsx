import { ReactNode } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router';

type AuthRouteProps = {
  children: ReactNode;
};

export default function AuthRoute({ children }: AuthRouteProps) {
  const { authenticated, user } = useAuth();
  const isLoading = authenticated && user === null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
