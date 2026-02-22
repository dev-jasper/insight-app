import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

beforeEach(() => {
    vi.resetModules();
});

describe("ProtectedRoute", () => {
    it("redirects to /login when not authenticated", async () => {
        vi.doMock("../AuthContext", () => ({
            useAuth: () => ({ isAuthenticated: false }),
        }));

        const { default: ProtectedRoute } = await import("../ProtectedRoute");

        render(
            <MemoryRouter initialEntries={["/analytics"]}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute>
                                <div>Analytics Page</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Login Page")).toBeInTheDocument();
        expect(screen.queryByText("Analytics Page")).not.toBeInTheDocument();
    });

    it("renders children when authenticated", async () => {
        vi.doMock("../AuthContext", () => ({
            useAuth: () => ({ isAuthenticated: true }),
        }));

        const { default: ProtectedRoute } = await import("../ProtectedRoute");

        render(
            <MemoryRouter initialEntries={["/analytics"]}>
                <Routes>
                    <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute>
                                <div>Analytics Page</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText("Analytics Page")).toBeInTheDocument();
    });
});