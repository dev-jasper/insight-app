import React, { createContext, useContext, useMemo, useState } from "react";
import { tokenStorage } from "./tokenStorage";

type AuthTokens = { access: string; refresh: string };

type AuthContextValue = {
    accessToken: string | null;
    isAuthenticated: boolean;
    login: (tokens: AuthTokens) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(() =>
        tokenStorage.getAccess()
    );

    const value = useMemo<AuthContextValue>(() => {
        return {
            accessToken,
            isAuthenticated: Boolean(accessToken),
            login: (tokens) => {
                tokenStorage.setTokens(tokens);
                setAccessToken(tokens.access);
            },
            logout: () => {
                tokenStorage.clear();
                setAccessToken(null);
            },
        };
    }, [accessToken]);

    return <AuthContext.Provider value={value}> {children} </AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}