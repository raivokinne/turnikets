export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    class?: string;
    avatar?: string;
    uuid: string;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateUserData {
    name: string;
    email: string;
    role: 'admin' | 'employee';
    class?: string;
    avatar?: string;
    password?: string;
    password_confirmation?: string;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    role?: 'admin' | 'employee';
    class?: string;
    avatar?: string;
    password?: string;
    password_confirmation?: string;
}

export interface UserStats {
    total_users: number;
    admin_users: number;
    employee_users: number;
    recent_users: number;
    users_by_class: Array<{
        class: string;
        count: number;
    }>;
}

export interface UserFilters {
    role?: 'admin' | 'employee';
    class?: string;
    search?: string;
    per_page?: number;
    page?: number;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface PaginatedUsers {
    data: User[];
    pagination: PaginationMeta;
}

export interface ApiResponse<T> {
    status: number;
    message?: string;
    data: T;
    errors?: Record<string, string[]>;
}

export interface UserFormErrors {
    name?: string[];
    email?: string[];
    role?: string[];
    class?: string[];
    password?: string[];
    password_confirmation?: string[];
}

export type UserType = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'employee';
    class?: string;
    created_at: string;
};