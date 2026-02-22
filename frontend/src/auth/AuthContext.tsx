import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { tokenStorage } from "./tokenStorage";
import { getJwtPayload } from "./jwt";
import { meApi } from "../api/auth";

type AuthTokens = { access: string; refresh: string };

export type AuthUser = {
    id?: number;
    username: string;
};

type AuthContextValue = {
    accessToken: string | null;
    isAuthenticated: boolean;
    user: AuthUser | null;
    login: (tokens: AuthTokens) => Promise<void> | void;
    logout: () => void;
    refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function userFromAccessToken(access: string | null): AuthUser | null {
    if (!access) return null;

    const payload = getJwtPayload(access) as any;
    if (!payload) return null;

    const id =
        typeof payload.user_id === "number"
            ? payload.user_id
            : typeof payload.id === "number"
                ? payload.id
                : undefined;

    const username =
        typeof payload.username === "string"
            ? payload.username
            : typeof payload.user?.username === "string"
                ? payload.user.username
                : typeof payload.name === "string"
                    ? payload.name
                    : typeof payload.sub === "string"
                        ? payload.sub
                        : "User";

    return { id, username };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(() => tokenStorage.getAccess());
    const [user, setUser] = useState<AuthUser | null>(() => userFromAccessToken(tokenStorage.getAccess()));

    async function refreshMe() {
        const token = tokenStorage.getAccess();
        if (!token) return;

        try {
            const me = await meApi();
            setUser({ id: me.id, username: me.username });
        } catch {
        }
    }
    useEffect(() => {
        if (!accessToken) return;
        refreshMe();
    }, [accessToken]);
    useEffect(() => {
        const handler = () => {
            tokenStorage.clear();
            setAccessToken(null);
            setUser(null);
        };
        window.addEventListener("auth:logout", handler);
        return () => window.removeEventListener("auth:logout", handler);
    }, []);

    const value = useMemo<AuthContextValue>(() => {
        return {
            accessToken,
            isAuthenticated: Boolean(accessToken),
            user,
            login: async (tokens) => {
                tokenStorage.setTokens(tokens);
                setAccessToken(tokens.access);
                setUser(userFromAccessToken(tokens.access));
                await refreshMe();
            },
            logout: () => {
                tokenStorage.clear();
                setAccessToken(null);
                setUser(null);
            },
            refreshMe,
        };
    }, [accessToken, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}