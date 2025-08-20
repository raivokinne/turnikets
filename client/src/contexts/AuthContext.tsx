import { createContext } from "react";
import { AuthContextValue } from "@/types/auth";

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    authenticated: false,
    login: async () => { /* Default implementation */ },
    logout: async () => { /* Default implementation */ }
});
