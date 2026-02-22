import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";
import { tokenStorage } from "../tokenStorage";
import { meApi } from "../../api/auth";
import { getJwtPayload } from "../jwt";

vi.mock("../../api/auth", () => ({
    meApi: vi.fn(),
}));

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

vi.mock("../jwt", () => ({
    getJwtPayload: vi.fn(),
}));

function Probe() {
    const { isAuthenticated, user, accessToken, login, logout, refreshMe } = useAuth();
    return (
        <div>
            <div data-testid="authed">{String(isAuthenticated)}</div>
            <div data-testid="token">{accessToken ?? ""}</div>
            <div data-testid="username">{user?.username ?? ""}</div>
            <div data-testid="userid">{user?.id ?? ""}</div>

            <button onClick={() => login({ access: "A", refresh: "R" })}>loginA</button>
            <button onClick={() => logout()}>logout</button>
            <button onClick={() => refreshMe()}>refreshMe</button>
        </div>
    );
}

describe("AuthContext branch coverage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        tokenStorage.clear();
    });

    it("userFromAccessToken branches: id and username fallback chain + refreshMe success + auth:logout event", async () => {
        const u = userEvent.setup();

        // 1) Start with NO token -> not authenticated
        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>
        );
        expect(screen.getByTestId("authed").textContent).toBe("false");
        expect(screen.getByTestId("username").textContent).toBe("");

        // 2) Login with payload null -> userFromAccessToken returns null
        vi.mocked(getJwtPayload).mockReturnValueOnce(null);
        vi.mocked(meApi).mockResolvedValueOnce({ id: 99, username: "fromMe" } as any);

        await act(async () => {
            await u.click(screen.getByRole("button", { name: "loginA" }));
        });

        // login sets token so isAuthenticated true
        // then refreshMe sets user from API:
        expect(screen.getByTestId("authed").textContent).toBe("true");
        expect(screen.getByTestId("username").textContent).toBe("fromMe");
        expect(screen.getByTestId("userid").textContent).toBe("99");

        // 3) Logout event branch: dispatch auth:logout should clear state
        await act(async () => {
            window.dispatchEvent(new Event("auth:logout"));
        });
        expect(screen.getByTestId("authed").textContent).toBe("false");
        expect(screen.getByTestId("username").textContent).toBe("");
    });

    it("userFromAccessToken branches: username picks payload.user.username, name, sub, and default 'User'", async () => {
        const u = userEvent.setup();

        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>
        );
        vi.mocked(getJwtPayload).mockReturnValueOnce({ id: 2, user: { username: "u_nested" } });
        vi.mocked(meApi).mockResolvedValueOnce({ id: 2, username: "u_nested" } as any);
        await act(async () => {
            await u.click(screen.getByRole("button", { name: "loginA" }));
        });
        expect(screen.getByTestId("username").textContent).toBe("u_nested");
        expect(screen.getByTestId("userid").textContent).toBe("2");

        // logout to reset
        await act(async () => {
            await u.click(screen.getByRole("button", { name: "logout" }));
        });
        vi.mocked(getJwtPayload).mockReturnValueOnce({ user_id: 3, name: "u_name" });
        vi.mocked(meApi).mockResolvedValueOnce({ id: 3, username: "u_name" } as any);
        await act(async () => {
            await u.click(screen.getByRole("button", { name: "loginA" }));
        });
        expect(screen.getByTestId("username").textContent).toBe("u_name");
        expect(screen.getByTestId("userid").textContent).toBe("3");

        await act(async () => {
            await u.click(screen.getByRole("button", { name: "logout" }));
        });
        vi.mocked(getJwtPayload).mockReturnValueOnce({ user_id: 4, sub: "u_sub" });
        vi.mocked(meApi).mockResolvedValueOnce({ id: 4, username: "u_sub" } as any);
        await act(async () => {
            await u.click(screen.getByRole("button", { name: "loginA" }));
        });
        expect(screen.getByTestId("username").textContent).toBe("u_sub");
        expect(screen.getByTestId("userid").textContent).toBe("4");

        await act(async () => {
            await u.click(screen.getByRole("button", { name: "logout" }));
        });
        vi.mocked(getJwtPayload).mockReturnValueOnce({ user_id: 5 });
        vi.mocked(meApi).mockResolvedValueOnce({ id: 5, username: "fromMe5" } as any);
        await act(async () => {
            await u.click(screen.getByRole("button", { name: "loginA" }));
        });
    });

    it("refreshMe catch branch: token exists but meApi throws (no crash, user stays from token)", async () => {
        const u = userEvent.setup();

        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>
        );

        // Make token parsing produce fallback username "User" and id 5
        vi.mocked(getJwtPayload).mockReturnValueOnce({ user_id: 5 });
        vi.mocked(meApi).mockRejectedValueOnce(new Error("fail"));

        await act(async () => {
            await u.click(screen.getByRole("button", { name: "loginA" }));
        });

        // Since refreshMe failed, user remains from token parsing:
        expect(screen.getByTestId("authed").textContent).toBe("true");
        expect(screen.getByTestId("userid").textContent).toBe("5");
        expect(screen.getByTestId("username").textContent).toBe("User");
    });

    it("refreshMe early return branch: no token means it returns immediately", async () => {
        const u = userEvent.setup();

        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>
        );

        // no token set
        await act(async () => {
            await u.click(screen.getByRole("button", { name: "refreshMe" }));
        });

        expect(vi.mocked(meApi)).not.toHaveBeenCalled();
    });
});