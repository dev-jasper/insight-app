import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockGetInsight = vi.fn();
const mockDeleteInsight = vi.fn();

let mockNav = vi.fn();
let mockUseAuth = () => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
});

vi.mock("../../api/insights", () => ({
    getInsight: (...args: any[]) => mockGetInsight(...args),
    deleteInsight: (...args: any[]) => mockDeleteInsight(...args),
}));

vi.mock("../../auth/tokenStorage", () => ({
    tokenStorage: {
        getAccess: vi.fn(),
    },
}));

vi.mock("../../auth/jwt", () => ({
    getJwtPayload: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({
    useAuth: () => mockUseAuth(),
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
    mockGetInsight.mockReset();
    mockDeleteInsight.mockReset();
    mockUseAuth = () => ({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
    });
});

describe("InsightDetailPage", () => {
    it("renders insight details and hides edit/delete when not authenticated", async () => {
        const InsightDetailPage = (await import("../InsightDetailPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 1,
            title: "Hello",
            category: "Macro",
            body: "Body text",
            tags: ["a", "b"],
            created_at: "2025-01-01T00:00:00Z",
            created_by: { id: 99, username: "owner" },
        });

        render(
            <MemoryRouter initialEntries={["/insights/1/"]}>
                <Routes>
                    <Route path="/insights/:id/" element={<InsightDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText("Hello")).toBeInTheDocument();
        expect(screen.getByText("Body text")).toBeInTheDocument();

        expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
        expect(screen.getByText(/Log in to edit\/delete/i)).toBeInTheDocument();
    });

    it("shows Edit when authenticated but not owner, and hides Delete", async () => {
        const { tokenStorage } = await import("../../auth/tokenStorage");
        const { getJwtPayload } = await import("../../auth/jwt");

        (tokenStorage.getAccess as any).mockReturnValue("token");
        (getJwtPayload as any).mockReturnValue({ user_id: 7 });

        mockUseAuth = () => ({
            isAuthenticated: true,
            user: { username: "tester" },
            login: vi.fn(),
            logout: vi.fn(),
        });

        const InsightDetailPage = (await import("../InsightDetailPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 2,
            title: "Not mine",
            category: "Macro",
            body: "Body",
            tags: [],
            created_at: "2025-01-01T00:00:00Z",
            created_by: { id: 999, username: "someone" },
        });

        render(
            <MemoryRouter initialEntries={["/insights/2/"]}>
                <Routes>
                    <Route path="/insights/:id/" element={<InsightDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText("Not mine")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
        expect(screen.getByText(/not the owner/i)).toBeInTheDocument();

        expect(screen.getByText(/No tags/i)).toBeInTheDocument();
    });

    it("shows Delete for owner and navigates after confirm", async () => {
        const { tokenStorage } = await import("../../auth/tokenStorage");
        const { getJwtPayload } = await import("../../auth/jwt");

        (tokenStorage.getAccess as any).mockReturnValue("token");
        (getJwtPayload as any).mockReturnValue({ user_id: 7 });

        mockUseAuth = () => ({
            isAuthenticated: true,
            user: { username: "me" },
            login: vi.fn(),
            logout: vi.fn(),
        });

        const InsightDetailPage = (await import("../InsightDetailPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 3,
            title: "Mine",
            category: "Macro",
            body: "Body",
            tags: ["x"],
            created_at: "2025-01-01T00:00:00Z",
            created_by: { id: 7, username: "me" },
        });

        mockDeleteInsight.mockResolvedValue(undefined);
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(
            <MemoryRouter initialEntries={["/insights/3/"]}>
                <Routes>
                    <Route path="/insights/:id/" element={<InsightDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText("Mine")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /delete/i }));

        await waitFor(() => {
            expect(mockDeleteInsight).toHaveBeenCalledWith(3);
        });

        await waitFor(() => {
            expect(mockNav).toHaveBeenCalledWith("/insights", { replace: true });
        });
    });

    it("does not delete when confirm is cancelled", async () => {
        const { tokenStorage } = await import("../../auth/tokenStorage");
        const { getJwtPayload } = await import("../../auth/jwt");

        (tokenStorage.getAccess as any).mockReturnValue("token");
        (getJwtPayload as any).mockReturnValue({ user_id: 7 });

        mockUseAuth = () => ({
            isAuthenticated: true,
            user: { username: "me" },
            login: vi.fn(),
            logout: vi.fn(),
        });

        const InsightDetailPage = (await import("../InsightDetailPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 4,
            title: "Mine2",
            category: "Macro",
            body: "Body",
            tags: [],
            created_at: "2025-01-01T00:00:00Z",
            created_by: { id: 7, username: "me" },
        });

        vi.spyOn(window, "confirm").mockReturnValue(false);

        render(
            <MemoryRouter initialEntries={["/insights/4/"]}>
                <Routes>
                    <Route path="/insights/:id/" element={<InsightDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText("Mine2")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /delete/i }));

        expect(mockDeleteInsight).not.toHaveBeenCalled();
    });

    it("shows API error detail when getInsight fails", async () => {
        const InsightDetailPage = (await import("../InsightDetailPage")).default;

        mockGetInsight.mockRejectedValue({
            response: { data: { detail: "Not found" } },
        });

        render(
            <MemoryRouter initialEntries={["/insights/999/"]}>
                <Routes>
                    <Route path="/insights/:id/" element={<InsightDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        await screen.findByText("Insight");
        expect(await screen.findByText(/Something went wrong/i)).toBeInTheDocument();
        expect(await screen.findByText("Not found")).toBeInTheDocument();
    });
});