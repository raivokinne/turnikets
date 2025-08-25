import { createContext, JSX, useCallback, useContext, useState, useEffect } from "react";
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

// Extend AuthContextValue to include isLoading
interface ExtendedAuthContextValue extends AuthContextValue {
    isLoading: boolean;
    isInitialized: boolean;
}

// Helper function to translate common error messages to Latvian
const translateErrorMessage = (message: string): string => {
    const translations: { [key: string]: string } = {
        "Wrong password or email": "Nepareiza parole vai e-pasta adrese",
        "Incorrect Payload": "Nepareizi dati",
        "Login failed": "Pierakstīšanās neveiksmīga",
        "Validation errors": "Validācijas kļūdas",
        "Network error": "Tīkla kļūda",
        "Server error": "Servera kļūda",
        "Unauthorized": "Nav autorizācijas",
        "Invalid credentials": "Nepareizi pieteikšanās dati",
        "User successfully logged in": "Pierakstīšanās veiksmīga"
    };

    return translations[message] || message;
};

// Helper function to extract and translate error message from response
const getErrorMessage = (error: any): string => {
    if (error?.response?.data?.errors?.message) {
        return translateErrorMessage(error.response.data.errors.message);
    }
    if (error?.response?.data?.message) {
        return translateErrorMessage(error.response.data.message);
    }
    if (error?.message) {
        return translateErrorMessage(error.message);
    }
    return "Nezināma kļūda";
};

const AuthContext = createContext<ExtendedAuthContextValue>({
    user: null,
    authenticated: false,
    isLoading: true,
    isInitialized: false,
    login: async () => { /* Default implementation */ },
    logout: async () => { /* Default implementation */ }
});

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
    const queryClient = useQueryClient();
    const [authenticated, setAuthenticated] = useState<boolean>(() => {
        return !!storage.get("token");
    });
    const [isInitialized, setIsInitialized] = useState(false);

    const { data: user, isLoading: userQueryLoading }: UseQueryResult<User | null> = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const token = storage.get("token");
                if (!token) {
                    setAuthenticated(false);
                    return null;
                }

                const userData = await authApi.getUser();
                setAuthenticated(true);
                return userData;
            } catch (error) {
                console.error('User fetch error:', error);
                // If token is invalid, remove it
                storage.remove("token");
                setAuthenticated(false);
                return null;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
        enabled: !!storage.get("token"), // Only run if token exists
    });

    // Set initialized after initial user query completes
    useEffect(() => {
        if (!userQueryLoading) {
            setIsInitialized(true);
        }
    }, [userQueryLoading]);

    const loginMutation: UseMutationResult<
        AuthResponse,
        Error,
        AuthCredentials
    > = useMutation({
        mutationFn: authApi.login,
        onSuccess: async (data: AuthResponse) => {
            if (data.status === 200 && data.token) {
                storage.set("token", data.token);
                setAuthenticated(true);

                // Refetch user data immediately
                await queryClient.refetchQueries({ queryKey: ['user'] });

                toast.success(data.message ? translateErrorMessage(data.message) : "Pierakstīšanās veiksmīga");
            } else {
                throw new Error(data.errors ?
                    (typeof data.errors === 'string' ? data.errors : 'Validācijas kļūdas') :
                    data.message || 'Pierakstīšanās neveiksmīga'
                );
            }
        },
        onError: (error: any) => {
            console.error('Login error:', error);
            const errorMessage = getErrorMessage(error);
            toast.error(errorMessage);
            setAuthenticated(false);
            storage.remove("token");
        }
    });

    const logoutMutation: UseMutationResult<
        void,
        Error,
        void
    > = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            storage.remove("token");
            setAuthenticated(false);
            queryClient.setQueryData(['user'], null);
            queryClient.clear(); // Clear all queries
            toast.success("Veiksmīgi izrakstījāties");
        },
        onError: (error: Error) => {
            console.error('Logout error:', error);
            // Still logout locally even if server request fails
            storage.remove("token");
            setAuthenticated(false);
            queryClient.setQueryData(['user'], null);
            queryClient.clear();
            toast.error("Izrakstīšanās ar kļūdām");
        }
    });

    const login = useCallback(async (credentials: AuthCredentials): Promise<void> => {
        return new Promise((resolve, reject) => {
            loginMutation.mutate(credentials, {
                onSuccess: () => resolve(),
                onError: (error) => reject(error)
            });
        });
    }, [loginMutation]);

    const logout = useCallback(async (): Promise<void> => {
        return new Promise((resolve) => {
            logoutMutation.mutate(undefined, {
                onSettled: () => resolve() // Always resolve, even on error
            });
        });
    }, [logoutMutation]);

    const isLoading = userQueryLoading || loginMutation.isPending || logoutMutation.isPending;

    return (
        <AuthContext.Provider value={{
            user: user || null,
            authenticated,
            isLoading,
            isInitialized,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): ExtendedAuthContextValue => useContext(AuthContext);