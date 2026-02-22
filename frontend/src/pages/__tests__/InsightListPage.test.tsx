import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import InsightsListPage from "../InsightsListPage";
import { AuthProvider } from "../../auth/AuthContext";
import { renderWithRouter } from "../../test/testUtils";
import { listInsights } from "../../api/insights";

vi.mock("../../api/insights", () => ({
    listInsights: vi.fn(),
}));

vi.mock("../../auth/tokenStorage", () => {
    let access: string | null = "access-jasper";
    let refresh: string | null = "refresh-x";
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
    getJwtPayload: () => ({ username: "Jasper", user_id: 1 }),
}));

describe("InsightsListPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders results", async () => {
        vi.mocked(listInsights).mockResolvedValueOnce({
            count: 1,
            next: null,
            previous: null,
            results: [
                {
                    id: 15,
                    title: "Budgeting & Cash Flow",
                    category: "Equities",
                    body: "Hello",
                    tags: ["Budget"],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: { id: 1, username: "Jasper" },
                },
            ],
        } as any);

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/insights" element={<InsightsListPage />} />
                </Routes>
            </AuthProvider>,
            { route: "/insights" }
        );

        // Wait for actual result
        expect(await screen.findByText("Budgeting & Cash Flow")).toBeInTheDocument();
        expect(screen.getAllByText("Jasper").length).toBeGreaterThan(0);
    });

    it("shows error state when api fails", async () => {
        vi.mocked(listInsights).mockRejectedValueOnce({ response: { data: { detail: "Boom" } } });

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/insights" element={<InsightsListPage />} />
                </Routes>
            </AuthProvider>,
            { route: "/insights" }
        );

        expect(await screen.findByText("Boom")).toBeInTheDocument();
    });

    it("shows Create Insight button when authenticated", async () => {
        vi.mocked(listInsights).mockResolvedValueOnce({
            count: 0,
            next: null,
            previous: null,
            results: [],
        } as any);

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/insights" element={<InsightsListPage />} />
                </Routes>
            </AuthProvider>,
            { route: "/insights" }
        );

        expect(await screen.findByText(/no insights found/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /\+ create insight/i })).toBeInTheDocument();
    });
});