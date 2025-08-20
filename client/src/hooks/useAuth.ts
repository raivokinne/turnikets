import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { AuthContextValue } from "@/types/auth";

export const useAuth = (): AuthContextValue => useContext(AuthContext);
