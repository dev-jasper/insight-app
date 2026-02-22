import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingBlock } from "../LoadingBlock";

describe("LoadingBlock", () => {
    it("renders default text", () => {
        render(<LoadingBlock />);
        expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("renders custom text", () => {
        render(<LoadingBlock text="Please wait" />);
        expect(screen.getByText("Please wait")).toBeInTheDocument();
    });
});