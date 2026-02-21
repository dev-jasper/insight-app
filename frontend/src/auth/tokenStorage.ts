const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const tokenStorage = {
    getAccess(): string | null {
        return localStorage.getItem(ACCESS_KEY);
    },
    getRefresh(): string | null {
        return localStorage.getItem(REFRESH_KEY);
    },
    setTokens(tokens: { access: string; refresh: string }) {
        localStorage.setItem(ACCESS_KEY, tokens.access);
        localStorage.setItem(REFRESH_KEY, tokens.refresh);
    },
    clear() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
};