import { describe, it, expect, beforeEach } from "vitest";
import { tokenStorage } from "../tokenStorage";

describe("tokenStorage", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("returns null when tokens are not set", () => {
        expect(tokenStorage.getAccess()).toBeNull();
        expect(tokenStorage.getRefresh()).toBeNull();
    });

    it("sets and gets tokens", () => {
        tokenStorage.setTokens({ access: "access123", refresh: "refresh123" });

        expect(tokenStorage.getAccess()).toBe("access123");
        expect(tokenStorage.getRefresh()).toBe("refresh123");
    });

    it("clears tokens", () => {
        tokenStorage.setTokens({ access: "a", refresh: "r" });
        tokenStorage.clear();

        expect(tokenStorage.getAccess()).toBeNull();
        expect(tokenStorage.getRefresh()).toBeNull();
    });
});