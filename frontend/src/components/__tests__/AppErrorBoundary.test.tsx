import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppErrorBoundary } from "../AppErrorBoundary";

function Boom() {
    throw new Error("Kaboom");
}

describe("AppErrorBoundary", () => {
    beforeEach(() => {
        // Silence React error logs from intentional throws
        vi.spyOn(console, "error").mockImplementation(() => { });
    });

    it("renders children when no error", () => {
        render(
            <AppErrorBoundary>
                <div>Ok</div>
            </AppErrorBoundary>
        );

        expect(screen.getByText("Ok")).toBeInTheDocument();
    });

    it("shows fallback UI and message when child throws", () => {
        render(
            <AppErrorBoundary>
                <Boom />
            </AppErrorBoundary>
        );

        expect(screen.getByRole("heading", { name: /app crashed/i })).toBeInTheDocument();
        expect(screen.getByText("Kaboom")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    });

    it("reload button calls window.location.reload", () => {
        const reloadSpy = vi.fn();

        // window.location is not always writable, so redefine it
        Object.defineProperty(window, "location", {
            value: { ...window.location, reload: reloadSpy },
            writable: true,
        });

        render(
            <AppErrorBoundary>
                <Boom />
            </AppErrorBoundary>
        );

        fireEvent.click(screen.getByRole("button", { name: /reload/i }));
        expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
});