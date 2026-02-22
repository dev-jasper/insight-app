import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

beforeEach(() => {
    vi.resetModules();
});

describe("App", () => {
    it("renders without crashing", async () => {
        // Mock auth so <AppRouter/> doesn't redirect weirdly
        vi.doMock("../auth/AuthContext", () => ({
            useAuth: () => ({ isAuthenticated: false }),
        }));

        const { default: App } = await import("../App");

        render(
            <MemoryRouter initialEntries={["/login"]}>
                <App />
            </MemoryRouter>
        );

        expect(document.body).toBeTruthy();
    });
});