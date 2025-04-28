import { createContext, JSX, useCallback, useContext, useState } from "react";
import {
  User,
  AuthContextValue,
  AuthCredentials,
  AuthResponse
} from "@/types/auth";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { storage } from "@/utils/storage";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult
} from "@tanstack/react-query";

type AuthProviderProps = {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authenticated: false,
  login: async () => { /* Default implementation */ },
  logout: async () => { /* Default implementation */ }
});

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState<boolean>(
    !!storage.get("token")
  );

  const { data: user }: UseQueryResult<User | null> = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        if (!authenticated) {
          return null;
        }
        return await authApi.getUser();
      } catch (error) {
        if (storage.get("token")) {
          storage.remove("token");
          setAuthenticated(false);
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation: UseMutationResult<
    AuthResponse,
    Error,
    AuthCredentials
  > = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: AuthResponse) => {
      if (data.status === 200 && data.token) {
        storage.set("token", data.token);
        toast.success(data.message);
        setAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } else {
        toast.error(data.errors ?
          (typeof data.errors === 'string' ? data.errors : 'Validation errors') :
          data.message
        );
      }
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      toast.error("Something went wrong");
      setAuthenticated(false);
    }
  });

  const logoutMutation: UseMutationResult<
    AuthResponse,
    Error,
    void
  > = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      storage.remove("token");
      setAuthenticated(false);
      queryClient.setQueryData(['user'], null);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      toast.error("Something went wrong");
    }
  });

  const login = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    loginMutation.mutate(credentials);
  }, [loginMutation]);

  const logout = useCallback(async (): Promise<void> => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return (
    <AuthContext.Provider value={{
      user: user || null,
      authenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => useContext(AuthContext);
