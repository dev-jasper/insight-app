import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnalyticsPage from "../AnalyticsPage";

const mockGetTopTags = vi.fn();
let mockNav = vi.fn();

vi.mock("../../api/insights", () => ({
    getTopTags: (...args: any[]) => mockGetTopTags(...args),
}));

// PageShell -> TopNav uses useAuth
vi.mock("../../auth/AuthContext", () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: { username: "tester" },
        login: vi.fn(),
        logout: vi.fn(),
    }),
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<any>("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNav,
    };
});

beforeEach(() => {
    mockNav = vi.fn();
    mockGetTopTags.mockReset();
});

describe("AnalyticsPage", () => {
    it("renders tags, summary stats, and navigates when clicking a chart bar", async () => {
        mockGetTopTags.mockResolvedValue({
            tags: [
                { name: "inflation", count: 10 },
                { name: "gdp", count: 2 },
            ],
        });

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>
        );

        expect(await screen.findByText("Insight Analytics Chart")).toBeInTheDocument();

        // Summary labels exist
        expect(screen.getByText("Total tag uses")).toBeInTheDocument();
        expect(screen.getByText("Unique tags")).toBeInTheDocument();
        expect(screen.getByText("Top tag")).toBeInTheDocument();
        expect(screen.getByText("Top tag uses")).toBeInTheDocument();

        // Tag appears somewhere (summary/chart/table)
        expect(screen.getAllByText(/#inflation/i).length).toBeGreaterThan(0);

        // (prevents accidentally selecting summary text which is not inside a button)
        const chartInflationBtn = screen
            .getAllByRole("button")
            .find((b) => (b.textContent || "").toLowerCase().includes("#inflation"));

        expect(chartInflationBtn).toBeTruthy();

        fireEvent.click(chartInflationBtn!);
        expect(mockNav).toHaveBeenCalledWith("/insights?tag=inflation");
    });

    it("filters by search query and minCount", async () => {
        mockGetTopTags.mockResolvedValue({
            tags: [
                { name: "inflation", count: 10 },
                { name: "gdp", count: 2 },
                { name: "growth", count: 1 },
            ],
        });

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>
        );

        await screen.findByText("Insight Analytics Chart");

        fireEvent.change(screen.getByPlaceholderText(/search tags/i), {
            target: { value: "gd" },
        });

        const table = screen.getByRole("table");
        expect(within(table).getAllByText(/#gdp/i).length).toBeGreaterThan(0);

        fireEvent.change(screen.getByTitle("Minimum count"), { target: { value: "5" } });

        expect(screen.getByText(/No tags found with the current filters/i)).toBeInTheDocument();
    });

    it("shows network error message when request fails without response", async () => {
        mockGetTopTags.mockRejectedValue(new Error("no response"));

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>
        );

        await screen.findByText("Insight Analytics Chart");
        expect(await screen.findByText(/Network error\. Please try again\./i)).toBeInTheDocument();
    });

    it("shows API detail error when present", async () => {
        mockGetTopTags.mockRejectedValue({
            response: { data: { detail: "Rate limited" } },
        });

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>
        );

        await screen.findByText("Insight Analytics Chart");
        expect(await screen.findByText("Rate limited")).toBeInTheDocument();
    });
});