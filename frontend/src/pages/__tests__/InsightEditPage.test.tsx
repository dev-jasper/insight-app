import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockGetInsight = vi.fn();
const mockUpdateInsight = vi.fn();
const mockParseApiError = vi.fn();

let mockNav = vi.fn();

vi.mock("../../api/insights", () => ({
    getInsight: (...args: any[]) => mockGetInsight(...args),
    updateInsight: (...args: any[]) => mockUpdateInsight(...args),
}));

vi.mock("../../api/errors", () => ({
    parseApiError: (...args: any[]) => mockParseApiError(...args),
}));

// PageShell -> TopNav uses useAuth; mock it to avoid provider requirement
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
    mockGetInsight.mockReset();
    mockUpdateInsight.mockReset();
    mockParseApiError.mockReset();
});

describe("InsightEditPage", () => {
    it("loads insight and allows adding/removing tags", async () => {
        const InsightEditPage = (await import("../InsightEditPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 1,
            title: "My title",
            category: "Macro",
            body: "This is a long enough body text to pass validation.",
            tags: ["alpha"],
        });

        render(
            <MemoryRouter initialEntries={["/insights/1/edit"]}>
                <Routes>
                    <Route path="/insights/:id/edit" element={<InsightEditPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByRole("heading", { name: "Edit Insight" })).toBeInTheDocument();

        expect(screen.getByDisplayValue("My title")).toBeInTheDocument();
        expect(screen.getByDisplayValue("This is a long enough body text to pass validation.")).toBeInTheDocument();
        expect(screen.getByText("#alpha")).toBeInTheDocument();

        const tagInput = screen.getByPlaceholderText(/type a tag/i);
        fireEvent.change(tagInput, { target: { value: "#Beta" } });
        fireEvent.click(screen.getByRole("button", { name: /add/i }));
        expect(screen.getByText("#Beta")).toBeInTheDocument();

        fireEvent.change(tagInput, { target: { value: "beta" } });
        fireEvent.click(screen.getByRole("button", { name: /add/i }));
        expect(screen.getAllByText("#Beta").length).toBe(1);

        fireEvent.click(screen.getByRole("button", { name: /#alpha/i }));
        expect(screen.queryByText("#alpha")).not.toBeInTheDocument();
    });

    it("shows client validation errors and prevents submit", async () => {
        const InsightEditPage = (await import("../InsightEditPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 2,
            title: "Valid title",
            category: "Macro",
            body: "This is a long enough body text to pass validation.",
            tags: ["t1"],
        });

        render(
            <MemoryRouter initialEntries={["/insights/2/edit"]}>
                <Routes>
                    <Route path="/insights/:id/edit" element={<InsightEditPage />} />
                </Routes>
            </MemoryRouter>
        );

        await screen.findByRole("heading", { name: "Edit Insight" });

        const titleInput = screen.getByPlaceholderText(/5–200 characters/i);
        fireEvent.change(titleInput, { target: { value: "" } });

        const saveBtn = screen.getByRole("button", { name: /^save$/i });
        expect(saveBtn).toBeDisabled();
    });

    it("submits successfully and navigates to detail page", async () => {
        const InsightEditPage = (await import("../InsightEditPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 3,
            title: "Valid title",
            category: "Macro",
            body: "This is a long enough body text to pass validation.",
            tags: ["t1"],
        });

        mockUpdateInsight.mockResolvedValue({ id: 3 });

        render(
            <MemoryRouter initialEntries={["/insights/3/edit"]}>
                <Routes>
                    <Route path="/insights/:id/edit" element={<InsightEditPage />} />
                </Routes>
            </MemoryRouter>
        );

        await screen.findByRole("heading", { name: "Edit Insight" });

        const saveBtn = screen.getByRole("button", { name: /^save$/i });
        expect(saveBtn).not.toBeDisabled();

        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockUpdateInsight).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(mockNav).toHaveBeenCalledWith("/insights/3", { replace: true });
        });
    });

    it("shows backend error + field errors on submit failure", async () => {
        const InsightEditPage = (await import("../InsightEditPage")).default;

        mockGetInsight.mockResolvedValue({
            id: 4,
            title: "Valid title",
            category: "Macro",
            body: "This is a long enough body text to pass validation.",
            tags: ["t1"],
        });

        mockUpdateInsight.mockRejectedValue(new Error("bad"));

        mockParseApiError.mockReturnValue({
            message: "Bad request",
            fieldErrors: { title: ["Too short"] },
        });

        render(
            <MemoryRouter initialEntries={["/insights/4/edit"]}>
                <Routes>
                    <Route path="/insights/:id/edit" element={<InsightEditPage />} />
                </Routes>
            </MemoryRouter>
        );

        await screen.findByRole("heading", { name: "Edit Insight" });

        fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

        expect(await screen.findByText(/Save failed/i)).toBeInTheDocument();
        expect(screen.getByText("Bad request")).toBeInTheDocument();
        expect(screen.getByText("Too short")).toBeInTheDocument();
    });

    it("shows load error when getInsight fails", async () => {
        const InsightEditPage = (await import("../InsightEditPage")).default;

        mockGetInsight.mockRejectedValue(new Error("fail"));
        mockParseApiError.mockReturnValue({ message: "Boom" });

        render(
            <MemoryRouter initialEntries={["/insights/999/edit"]}>
                <Routes>
                    <Route path="/insights/:id/edit" element={<InsightEditPage />} />
                </Routes>
            </MemoryRouter>
        );

        await screen.findByRole("heading", { name: "Edit Insight" });
        expect(await screen.findByText("Boom")).toBeInTheDocument();
    });
});