import { api } from "@/utils/api";
import {
  User,
  AuthCredentials,
  AuthResponse
} from "@/types/auth";

export const authApi = {
  getUser: async (): Promise<User> => {
    const response = await api.get<User>("auth/user");
    return response.data;
  },

  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("guest/login", credentials);
    return response.data;
  },

  logout: async (): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("auth/logout");
    return response.data;
  }
};
