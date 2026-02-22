import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBanner } from "../ErrorBanner";

describe("ErrorBanner", () => {
    it("returns null when message is empty", () => {
        const { container } = render(<ErrorBanner message="" />);
        expect(container.firstChild).toBeNull();
    });

    it("renders the message when provided", () => {
        render(<ErrorBanner message="Something failed" />);
        expect(screen.getByText("Something failed")).toBeInTheDocument();
    });
});