export type Paginated<T> = {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
};

// If you already know the exact enum values, replace this with a union:
// export type Category = "Macro" | "Equities" | "FixedIncome" | "Alternatives";
export type Category = string;

export type UserMini = {
    id: number;
    username: string;
};

export type Insight = {
    id: number;
    title: string;
    category: Category;
    body: string;
    tags: string[];
    created_by: UserMini;
    created_at: string;
    updated_at: string;
};

export type LoginPayload = { username: string; password: string };

export type LoginResponse = {
    access: string;
    refresh: string;
};

export type TopTag = {
    name: string;
    count: number;
};

export type TopTagsResponse = {
    tags: TopTag[];
};

export type ApiError = {
    detail?: string;
    errors?: Record<string, string[]>;
};