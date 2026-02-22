import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// 1) Mock dependencies FIRST (hoisted)
vi.mock("../../components/TopNav", () => ({
    default: () => <div data-testid="topnav" />,
}));

let authed = false;
vi.mock("../../auth/AuthContext", () => ({
    useAuth: () => ({ isAuthenticated: authed }),
}));

// IMPORTANT: mock module export that the page imports
vi.mock("../../api/insights", () => ({
    listInsights: vi.fn(),
}));

async function getMocks() {
    const mod = await import("../../api/insights");
    return {
        listInsights: vi.mocked(mod.listInsights),
    };
}

describe("InsightsListPage branch coverage", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules(); // prevents module-state bleed between test files
        authed = false;
    });

    it("reads query params on mount, fetches with params, renders results + pagination and Create button when authenticated", async () => {
        const u = userEvent.setup();
        authed = true;

        const { listInsights } = await getMocks();

        const emptyPage = {
            count: 0,
            next: null,
            previous: null,
            results: [],
        };

        const pageWithResults = {
            count: 12,
            next: "/api/insights/?page=3",
            previous: "/api/insights/?page=1",
            results: [
                {
                    id: 1,
                    title: "Alpha",
                    category: "Macro",
                    body: "x ".repeat(300),
                    created_by: { id: 10, username: "Jasper" },
                    created_at: "",
                    updated_at: "",
                    tags: ["Inflation", "Rates"],
                },
                {
                    id: 2,
                    title: "Beta",
                    category: "Equities",
                    body: "short body",
                    created_by: { id: 11, username: "Vera" },
                    created_at: "",
                    updated_at: "",
                    tags: [],
                },
            ],
        };

        // Key fix: the component calls listInsights more than once.
        // Return results only when the URL-derived params are present.
        listInsights.mockImplementation(async (params: any) => {
            if (
                params?.search === "foo" &&
                params?.tag === "bar" &&
                params?.category === "Macro" &&
                params?.ordering === "title" &&
                params?.page === 2 &&
                params?.page_size === 20
            ) {
                return pageWithResults as any;
            }
            return emptyPage as any; // for the initial default fetch
        });

        // Import AFTER mocks are ready
        const { default: InsightsListPage } = await import("../InsightsListPage");

        render(
            <MemoryRouter
                initialEntries={[
                    "/insights?search=foo&tag=bar&category=Macro&ordering=title&page=2&page_size=20",
                ]}
            >
                <Routes>
                    <Route path="/insights" element={<InsightsListPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Create button visible when authenticated
        expect(
            screen.getByRole("button", { name: /\+ create insight/i })
        ).toBeInTheDocument();

        // Wait for results (the URL-param fetch)
        expect(await screen.findByText("Alpha")).toBeInTheDocument();
        expect(screen.getByText("Beta")).toBeInTheDocument();

        // Tag pills
        expect(screen.getByText("#Inflation")).toBeInTheDocument();
        expect(screen.getByText("#Rates")).toBeInTheDocument();

        // Snippet truncation should show ellipsis (…)
        expect(
            screen.getAllByText((t) => typeof t === "string" && t.includes("…"))
                .length
        ).toBeGreaterThan(0);

        // Pagination enabled (because next/previous exist in the results response)
        const prevBtn = screen.getByRole("button", { name: /prev/i });
        const nextBtn = screen.getByRole("button", { name: /next/i });
        expect(prevBtn).not.toBeDisabled();
        expect(nextBtn).not.toBeDisabled();

        // Ensure we eventually called with the URL-derived params
        await waitFor(() => {
            expect(listInsights).toHaveBeenCalled();
            const calls = listInsights.mock.calls.map((c) => c[0]);
            expect(
                calls.some((p: any) =>
                    p?.search === "foo" &&
                    p?.tag === "bar" &&
                    p?.category === "Macro" &&
                    p?.ordering === "title" &&
                    p?.page === 2 &&
                    p?.page_size === 20
                )
            ).toBe(true);
        });

        // Clicking Next should trigger another fetch call
        listInsights.mockImplementationOnce(async () => emptyPage as any);
        await u.click(nextBtn);
        await waitFor(() => expect(listInsights).toHaveBeenCalledTimes(3)); // usually: initial + url + next
    });

    it("renders error state on API failure; reset clears filters; renders empty state when no results", async () => {
        const u = userEvent.setup();
        authed = false;

        const { listInsights } = await getMocks();

        const emptyPage = {
            count: 0,
            next: null,
            previous: null,
            results: [],
        };

        // Key fix: reject only for the URL-derived params, so error doesn't get overwritten
        // by the initial default fetch or by a subsequent successful fetch.
        listInsights.mockImplementation(async (params: any) => {
            if (params?.search === "foo" && params?.tag === "bar" && params?.category === "Macro") {
                throw {
                    response: { status: 500, data: { detail: "Server down" } },
                    message: "boom",
                };
            }
            return emptyPage as any;
        });

        const { default: InsightsListPage } = await import("../InsightsListPage");

        render(
            <MemoryRouter
                initialEntries={[
                    "/insights?search=foo&tag=bar&category=Macro&page=3&page_size=50",
                ]}
            >
                <Routes>
                    <Route path="/insights" element={<InsightsListPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Error should show
        expect(
            await screen.findByText(/server down|request failed|network error/i)
        ).toBeInTheDocument();

        // Create button hidden when not authenticated
        expect(
            screen.queryByRole("button", { name: /\+ create insight/i })
        ).not.toBeInTheDocument();

        // After Reset -> params become defaults -> our mock returns empty -> "No insights found."
        await u.click(screen.getByRole("button", { name: /reset/i }));

        expect(await screen.findByText(/no insights found/i)).toBeInTheDocument();
        expect((screen.getByPlaceholderText(/search title/i) as HTMLInputElement).value).toBe("");
        expect((screen.getByPlaceholderText(/tag/i) as HTMLInputElement).value).toBe("");
    });
});