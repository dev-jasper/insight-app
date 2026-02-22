import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider, useAuth } from "../AuthContext";

// ---- helpers: build a JWT your real decoder can parse ----
function base64UrlEncode(obj: unknown) {
    const json = JSON.stringify(obj);
    const b64 = btoa(
        encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(parseInt(p1, 16))
        )
    );
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function makeJwt(payload: Record<string, any>) {
    const header = base64UrlEncode({ alg: "none", typ: "JWT" });
    const body = base64UrlEncode(payload);
    return `${header}.${body}.sig`;
}

const ACCESS_JWT = makeJwt({ username: "Jasper", user_id: 1 });
const REFRESH_JWT = makeJwt({ token_type: "refresh" });

// ---- mock tokenStorage to avoid real localStorage interference ----
vi.mock("../tokenStorage", () => {
    let access: string | null = null;
    let refresh: string | null = null;

    return {
        tokenStorage: {
            getAccess: () => access,
            getRefresh: () => refresh,
            setTokens: (t: { access: string; refresh: string }) => {
                access = t.access;
                refresh = t.refresh;
            },
            clear: () => {
                access = null;
                refresh = null;
            },
        },
    };
});

vi.mock("../../api/auth", () => ({
    meApi: vi.fn().mockResolvedValue({ id: 1, username: "Jasper" }),
}));

function Probe() {
    const { isAuthenticated, user, login, logout } = useAuth();

    return (
        <div>
            <div data-testid="auth">{isAuthenticated ? "yes" : "no"}</div>
            <div data-testid="user">{user?.username ?? "none"}</div>

            <button
                type="button"
                onClick={() => login({ access: ACCESS_JWT, refresh: REFRESH_JWT })}
            >
                do-login
            </button>

            <button type="button" onClick={logout}>
                do-logout
            </button>
        </div>
    );
}

function renderWithAuth(ui: React.ReactElement) {
    return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("AuthContext", () => {
    beforeEach(async () => {
        const { tokenStorage } = await import("../tokenStorage");
        tokenStorage.clear();
    });

    it("login sets authenticated state + user", async () => {
        const u = userEvent.setup();
        renderWithAuth(<Probe />);

        await u.click(screen.getByRole("button", { name: "do-login" }));

        expect(await screen.findByTestId("auth")).toHaveTextContent("yes");
        expect(await screen.findByTestId("user")).toHaveTextContent("Jasper");
    });

    it("logout clears authenticated state + user", async () => {
        const u = userEvent.setup();
        renderWithAuth(<Probe />);

        await u.click(screen.getByRole("button", { name: "do-login" }));
        expect(await screen.findByTestId("auth")).toHaveTextContent("yes");

        await u.click(screen.getByRole("button", { name: "do-logout" }));

        expect(await screen.findByTestId("auth")).toHaveTextContent("no");
        expect(await screen.findByTestId("user")).toHaveTextContent("none");
    });
});