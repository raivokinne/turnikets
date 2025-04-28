import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

type AuthRouteProps = {
  children: ReactNode;
};

export default function AuthRoute({ children }: AuthRouteProps) {
  const { authenticated, user } = useAuth();
  const location = useLocation();
  const isLoading = authenticated && user === null;

  const from = new URLSearchParams(location.search).get('redirect') || '/dashboard';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
