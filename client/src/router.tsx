import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import LoginPage from "./screens/Auth/Login";
import DashboardPage from "./screens/Dashboard/Index";

const router = createBrowserRouter([
	{
		path: "/",
		element: <LoginPage />
	},
	{
		path: "/dashboard",
		element: <DashboardPage />
	}
])

export const AppRouter = () => <RouterProvider router={router} />
