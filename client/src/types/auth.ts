export interface User {
	id: string;
	name: string;
	email: string;
	role: string
}

export interface AuthCredentials {
	email: string;
	password: string;
}

export interface AuthResponse {
	status: number;
	message: string;
	token?: string;
	errors?: string | Record<string, string[]>;
}

export interface AuthContextValue {
	user: User | null;
	authenticated: boolean;
	login: (credentials: AuthCredentials) => Promise<void>;
	logout: () => Promise<void>;
}
