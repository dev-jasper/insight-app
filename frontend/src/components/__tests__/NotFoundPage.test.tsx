import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFoundPage from "../NotFoundPage";

it("renders 404 and link to insights", () => {
    render(
        <MemoryRouter>
            <NotFoundPage />
        </MemoryRouter>
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("That page doesn’t exist.")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /go to insights/i });
    expect(link).toHaveAttribute("href", "/insights");
});