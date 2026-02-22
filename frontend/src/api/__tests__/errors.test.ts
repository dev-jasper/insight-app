import { describe, it, expect } from "vitest";
import { parseApiError } from "../errors";

describe("parseApiError", () => {
    it("returns network error when no response", () => {
        const parsed = parseApiError({ message: "Network down" } as any);
        expect(parsed.message).toMatch(/network error/i);
        expect(parsed.fieldErrors).toEqual({});
        expect(parsed.status).toBeUndefined();
    });

    it("handles HTML string response (wrong URL / 404 page)", () => {
        const html = "<!doctype html><html><body>Not Found</body></html>";
        const parsed = parseApiError({ response: { status: 404, data: html } } as any);

        expect(parsed.message).toMatch(/request failed/i);
        expect(parsed.message).toMatch(/404/);
        expect(parsed.fieldErrors).toEqual({});
        expect(parsed.status).toBe(404);
    });

    it("prefers details object as fieldErrors when data.error.details is object", () => {
        const parsed = parseApiError({
            response: {
                status: 400,
                data: { error: { details: { username: ["Bad username"] } } },
            },
        } as any);

        expect(parsed.fieldErrors).toEqual({ username: ["Bad username"] });
        expect(parsed.status).toBe(400);
    });

    it("falls back to data.errors when details is not an object", () => {
        const parsed = parseApiError({
            response: {
                status: 400,
                data: { error: { details: "nope" }, errors: { password: ["Too short"] } },
            },
        } as any);

        expect(parsed.fieldErrors).toEqual({ password: ["Too short"] });
    });

    it("message uses details.detail[0] when it is an array", () => {
        const parsed = parseApiError({
            response: {
                status: 400,
                data: { error: { details: { detail: ["First detail wins"] } } },
            },
        } as any);

        expect(parsed.message).toContain("First detail wins");
    });

    it("message falls back to data.detail then data.error.code then err.message then default", () => {
        const a = parseApiError({ response: { status: 400, data: { detail: "Detail msg" } } } as any);
        expect(a.message).toContain("Detail msg");

        const b = parseApiError({ response: { status: 400, data: { error: { code: "CODE_X" } } } } as any);
        expect(b.message).toContain("CODE_X");

        const c = parseApiError({ response: { status: 500, data: {} }, message: "Boom" } as any);
        expect(c.message).toContain("Boom");

        const d = parseApiError({ response: { status: 500, data: {} } } as any);
        expect(d.message).toMatch(/request failed/i);
    });
});