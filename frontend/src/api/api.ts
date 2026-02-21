export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface User {
    id: number;
    username: string;
}

export interface Insight {
    id: number;
    title: string;
    category: string;
    body: string;
    created_by: User;
    created_at: string;
    updated_at: string;
    tags: string[];
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface TopTag {
    tag: string;
    count: number;
}
