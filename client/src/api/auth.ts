import { api } from "@/utils/api";
import { User, AuthCredentials, AuthResponse } from "@/types/auth";

export const authApi = {
    getUser: async (): Promise<User> => {
        const response = await api.get("user");
        return response.data;
    },

    login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
        const response = await api.post("auth/login", credentials);
        return response.data;
    },

    logout: async (): Promise<void> => {
        const response = await api.post("auth/logout");
        if (response.data.status !== 200) {
            throw new Error(response.data.message || "Logout failed");
        }
    },

    getAllUsers: async (): Promise<User[]> => {
        const response = await api.get("auth/users");
        return response.data.data;
    },
};
