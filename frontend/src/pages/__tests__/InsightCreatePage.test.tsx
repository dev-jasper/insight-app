import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InsightCreatePage from "../InsightCreatePage";
import { renderWithRouter, Page } from "../../test/testUtils";
import { AuthProvider } from "../../auth/AuthContext";
import { createInsight } from "../../api/insights";

vi.mock("../../api/insights", () => ({
    createInsight: vi.fn(),
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

describe("InsightCreatePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("shows validation errors if submit empty", async () => {
        const u = userEvent.setup();

        renderWithRouter(
            <AuthProvider>
                <Routes>
                    <Route path="/insights/new" element={<InsightCreatePage />} />
                </Routes>
            </AuthProvider>,
            { route: "/insights/new" }
        );

        await u.click(screen.getByRole("button", { name: /create/i }));

        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/body is required/i)).toBeInTheDocument();
        expect(screen.getByText(/at least 1 tag/i)).toBeInTheDocument();

        expect(vi.mocked(createInsight)).not.toHaveBeenCalled();
    });

    it(
        "submits successfully and redirects to detail page",
        async () => {
            const u = userEvent.setup();

            vi.mocked(createInsight).mockResolvedValueOnce({ id: 123 } as any);

            renderWithRouter(
                <AuthProvider>
                    <Routes>
                        <Route path="/insights/new" element={<InsightCreatePage />} />
                        <Route path="/insights/123" element={<Page text="DETAIL-123" />} />
                    </Routes>
                </AuthProvider>,
                { route: "/insights/new" }
            );

            await u.type(screen.getByPlaceholderText(/5–200/i), "A valid title");

            const categorySelect = screen.getByRole("combobox");
            await u.selectOptions(categorySelect, "Macro");

            await u.type(screen.getByPlaceholderText(/minimum 20/i), "This is a body long enough.");

            await u.type(screen.getByPlaceholderText(/type a tag/i), "Inflation");
            await u.click(screen.getByRole("button", { name: /add/i }));

            await u.click(screen.getByRole("button", { name: /^create$/i }));

            expect(await screen.findByText("DETAIL-123")).toBeInTheDocument();
            expect(vi.mocked(createInsight)).toHaveBeenCalledWith({
                title: "A valid title",
                category: "Macro",
                body: "This is a body long enough.",
                tags: ["Inflation"],
            });
        },
        15000
    );
});