import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

beforeEach(() => {
    vi.resetModules();
});

describe("AppRouter", () => {
    it("shows login page when route is /login", async () => {
        vi.doMock("../../auth/AuthContext", () => ({
            useAuth: () => ({ isAuthenticated: false }),
        }));

        const { default: AppRouter } = await import("../AppRouter");

        render(
            <MemoryRouter initialEntries={["/login"]}>
                <AppRouter />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("heading", { name: /welcome back/i })
        ).toBeInTheDocument();

        // Optional extra stable check
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("redirects / to login when not authenticated (ProtectedRoute)", async () => {
        vi.doMock("../../auth/AuthContext", () => ({
            useAuth: () => ({ isAuthenticated: false }),
        }));

        const { default: AppRouter } = await import("../AppRouter");

        render(
            <MemoryRouter initialEntries={["/"]}>
                <AppRouter />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("heading", { name: /welcome back/i })
        ).toBeInTheDocument();
    });

    it("redirects / to /insights when authenticated", async () => {
        vi.doMock("../../auth/AuthContext", () => ({
            useAuth: () => ({ isAuthenticated: true }),
        }));

        vi.doMock("../../api/insights", () => ({
            listInsights: vi.fn().mockResolvedValue({ results: [], count: 0 }),
        }));

        const { default: AppRouter } = await import("../AppRouter");

        render(
            <MemoryRouter initialEntries={["/"]}>
                <AppRouter />
            </MemoryRouter>
        );

        expect(
            await screen.findByRole("heading", { name: /^Insights$/ })
        ).toBeInTheDocument();
    });

    it("renders NotFoundPage for unknown routes", async () => {
        vi.doMock("../../auth/AuthContext", () => ({
            useAuth: () => ({ isAuthenticated: true }),
        }));

        const { default: AppRouter } = await import("../AppRouter");

        render(
            <MemoryRouter initialEntries={["/some-unknown-route"]}>
                <AppRouter />
            </MemoryRouter>
        );

        expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /go back/i })).toBeInTheDocument();
    });
});