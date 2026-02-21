export type LoginResponse = {
    access: string;
    refresh: string;
};

export type ApiError = {
    message?: string;
    errors?: Record<string, string[]>;
};