import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, type RenderOptions } from "@testing-library/react";

export function renderWithRouter(
    ui: React.ReactElement,
    {
        route = "/",
        routes,
    }: { route?: string; routes?: React.ReactNode } & RenderOptions = {}
) {
    return render(
        <MemoryRouter initialEntries={[route]}>
            {routes ? routes : ui}
        </MemoryRouter>
    );
}

// Small helpers for dummy pages in route tests
export function Page({ text }: { text: string }) {
    return <div>{text}</div>;
}