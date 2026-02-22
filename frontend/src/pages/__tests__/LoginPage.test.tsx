import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Route, Routes, MemoryRouter } from "react-router-dom";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../LoginPage";
import { AuthProvider } from "../../auth/AuthContext";
import { renderWithRouter, Page } from "../../test/testUtils";
import { loginApi } from "../../api/auth";

vi.mock("../../api/auth", () => ({
    loginApi: vi.fn(),
    meApi: vi.fn(),
}));

vi.mock("../../auth/tokenStorage", () => {
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

vi.mock("../../auth/jwt", () => ({
    getJwtPayload: (token: string) => {
        if (token) return { username: "Jasper", user_id: 1 };
        return null;
    },
}));

describe("LoginPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("prevents submit when fields are empty", async () => {
        const u = userEvent.setup();

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/insights" element={<Page text="INSIGHTS" />} />
                </Routes>
            </AuthProvider>,
            { route: "/login" }
        );

        const btn = screen.getByRole("button", { name: /sign in/i });

        // UI disables submit when empty
        expect(btn).toBeDisabled();

        await u.click(btn);
        expect(vi.mocked(loginApi)).not.toHaveBeenCalled();
    });

    it("successful login redirects to /insights", async () => {
        const u = userEvent.setup();

        vi.mocked(loginApi).mockResolvedValueOnce({
            access: "access-jasper",
            refresh: "refresh-x",
        } as any);

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/insights" element={<Page text="INSIGHTS" />} />
                </Routes>
            </AuthProvider>,
            { route: "/login" }
        );

        await u.type(screen.getByPlaceholderText(/e\.g\./i), "Jasper");
        await u.type(screen.getByPlaceholderText(/••••/i), "password123");
        await u.click(screen.getByRole("button", { name: /sign in/i }));

        expect(await screen.findByText("INSIGHTS")).toBeInTheDocument();
        expect(vi.mocked(loginApi)).toHaveBeenCalledWith({
            username: "Jasper",
            password: "password123",
        });
    });

    // ✅ NEW 1: redirectTo branch via location.state.from.pathname
    it("redirects to location.state.from.pathname when provided", async () => {
        const u = userEvent.setup();

        vi.mocked(loginApi).mockResolvedValueOnce({
            access: "access-jasper",
            refresh: "refresh-x",
        } as any);

        render(
            <AuthProvider>
                <MemoryRouter
                    initialEntries={[
                        { pathname: "/login", state: { from: { pathname: "/analytics" } } } as any,
                    ]}
                >
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/analytics" element={<Page text="ANALYTICS" />} />
                    </Routes>
                </MemoryRouter>
            </AuthProvider>
        );

        await u.type(screen.getByPlaceholderText(/e\.g\./i), "Jasper");
        await u.type(screen.getByPlaceholderText(/••••/i), "password123");
        await u.click(screen.getByRole("button", { name: /sign in/i }));

        expect(await screen.findByText("ANALYTICS")).toBeInTheDocument();
    });

    // ✅ NEW 2: show/hide password branch
    it("toggles password visibility when clicking Show/Hide", async () => {
        const u = userEvent.setup();

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </AuthProvider>,
            { route: "/login" }
        );

        const pw = screen.getByPlaceholderText(/••••/i) as HTMLInputElement;
        expect(pw.type).toBe("password");

        const toggle = screen.getByRole("button", { name: /show/i });
        await u.click(toggle);

        expect((screen.getByPlaceholderText(/••••/i) as HTMLInputElement).type).toBe("text");
        expect(screen.getByRole("button", { name: /hide/i })).toBeInTheDocument();
    });

    // ✅ NEW 3: catch branch + parseApiError mapping to field errors
    it("shows form error + backend field errors when loginApi fails with errors", async () => {
        const u = userEvent.setup();

        vi.mocked(loginApi).mockRejectedValueOnce({
            response: {
                status: 400,
                data: {
                    detail: "Invalid credentials",
                    errors: {
                        username: ["Unknown username"],
                        password: ["Wrong password"],
                    },
                },
            },
            message: "bad request",
        } as any);

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </AuthProvider>,
            { route: "/login" }
        );

        await u.type(screen.getByPlaceholderText(/e\.g\./i), "Jasper");
        await u.type(screen.getByPlaceholderText(/••••/i), "password123");
        await u.click(screen.getByRole("button", { name: /sign in/i }));

        // Form-level error shown
        expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();

        // Field errors mapped
        expect(screen.getByText(/unknown username/i)).toBeInTheDocument();
        expect(screen.getByText(/wrong password/i)).toBeInTheDocument();
    });
});