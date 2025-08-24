import { createBrowserRouter, Navigate } from "react-router-dom";
import { RouterProvider } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import LoginPage from "./screens/Auth/Login";
import Dashboard from "./screens/Dashboard";
import Edit from "./screens/Profile/Edit";

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { authenticated, isLoading, isInitialized } = useAuth();

    // Show loading while checking authentication
    if (!isInitialized || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-600 mx-auto"></div>
                    <p className="mt-6 text-gray-500 text-lg font-medium">Ielādē...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!authenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

// Public Route Component (redirects if already authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { authenticated, isLoading, isInitialized } = useAuth();

    // Show loading while checking authentication
    if (!isInitialized || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-600 mx-auto"></div>
                    <p className="mt-6 text-gray-500 text-lg font-medium">Pārbauda autentifikāciju...</p>
                </div>
            </div>
        );
    }

    if (authenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        )
    },
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        )
    },
    {
        path: "/profile",
        element: (
            <ProtectedRoute>
                <Edit />
            </ProtectedRoute>
        )
    },
    {
        path: "*",
        element: <Navigate to="/" replace />
    }
]);

export const AppRouter = () => <RouterProvider router={router} />;