import { describe, it, expect } from "vitest";
import { getJwtPayload } from "../jwt";

function b64url(obj: any) {
    // base64url without padding
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

describe("getJwtPayload", () => {
    it("returns null when payload part is missing", () => {
        expect(getJwtPayload("onlyheader")).toBeNull();
        expect(getJwtPayload("a.")).toBeNull();
    });

    it("returns null for invalid base64 / invalid JSON", () => {
        expect(getJwtPayload("a.invalid_payload.b")).toBeNull();
    });

    it("parses a valid JWT payload", () => {
        const token = `${b64url({ alg: "none", typ: "JWT" })}.${b64url({ sub: "1", username: "jasper" })}.`;
        const payload = getJwtPayload(token);

        expect(payload).toEqual({ sub: "1", username: "jasper" });
    });

    it("handles url-safe base64 chars '-' and '_'", () => {
        // create a payload that likely produces url-safe chars by using base64url
        const token = `${b64url({ alg: "none" })}.${b64url({ hello: "world" })}.`;
        const payload = getJwtPayload(token);
        expect(payload).toEqual({ hello: "world" });
    });
});