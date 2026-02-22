import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import TopNav from "../TopNav";

// mock navigate
const navMock = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual: any = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => navMock,
    };
});

// mock auth hook
const logoutMock = vi.fn();
let authState: any = null;

vi.mock("../../auth/AuthContext", () => ({
    useAuth: () => authState,
}));

beforeEach(() => {
    navMock.mockClear();
    logoutMock.mockClear();
});

it("shows Login button when not authenticated and navigates to /login on click", () => {
    authState = { isAuthenticated: false, user: null, logout: logoutMock };

    render(
        <MemoryRouter initialEntries={["/insights"]}>
            <TopNav />
        </MemoryRouter>
    );

    const btn = screen.getByRole("button", { name: /login/i });
    fireEvent.click(btn);

    expect(navMock).toHaveBeenCalledWith("/login");
    expect(logoutMock).not.toHaveBeenCalled();
});

it("shows username + Logout when authenticated; clicking logout calls logout and redirects replace:/login", () => {
    authState = { isAuthenticated: true, user: { username: "jasper" }, logout: logoutMock };

    render(
        <MemoryRouter initialEntries={["/insights"]}>
            <TopNav />
        </MemoryRouter>
    );

    expect(screen.getByText("jasper")).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(btn);

    expect(logoutMock).toHaveBeenCalled();
    expect(navMock).toHaveBeenCalledWith("/login", { replace: true });
});