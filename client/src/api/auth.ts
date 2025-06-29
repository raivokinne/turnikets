import { api } from "@/utils/api";
import { User, AuthCredentials, AuthResponse } from "@/types/auth";

interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  errors?: string | Record<string, string[]>;
}

export const authApi = {
  getUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>("user");
    return response.data.data;
  },

  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("auth/login", credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const response = await api.post<ApiResponse<never>>("auth/logout");
    if (response.data.status !== 200) {
      throw new Error(response.data.message || "Logout failed");
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>("auth/users");
    return response.data.data;
  },
};
