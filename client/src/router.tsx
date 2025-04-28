import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import LoginPage from "./screens/Auth/Login";
import Dashboard from "./screens/Dashboard";
import Edit from "./screens/Profile/Edit";

const router = createBrowserRouter([
	{
		path: "/",
		element: <LoginPage />
	},
	{
		path: "/dashboard",
		element: <Dashboard />
	},
	{
		path: "/profile",
		element: <Edit />
	}
])

export const AppRouter = () => <RouterProvider router={router} />
