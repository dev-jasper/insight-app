import { describe, it, expect, vi, beforeEach } from "vitest";
import { http } from "../http";
import { tokenStorage } from "../../auth/tokenStorage";

describe("api/http interceptors", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("adds Authorization header when access token exists", async () => {
        vi.spyOn(tokenStorage, "getAccess").mockReturnValue("mytoken");

        // axios keeps handlers here
        const handler = (http.interceptors.request as any).handlers[0].fulfilled;

        const cfg = await handler({ headers: {} });
        expect(cfg.headers.Authorization).toBe("Bearer mytoken");
    });

    it("does NOT add Authorization header when no token", async () => {
        vi.spyOn(tokenStorage, "getAccess").mockReturnValue(null as any);

        const handler = (http.interceptors.request as any).handlers[0].fulfilled;

        const cfg = await handler({ headers: {} });
        expect(cfg.headers.Authorization).toBeUndefined();
    });

    it("on 401 clears tokens and dispatches auth:logout event", async () => {
        const clearSpy = vi.spyOn(tokenStorage, "clear").mockImplementation(() => { });
        const dispatchSpy = vi.spyOn(window, "dispatchEvent");

        const rejected = (http.interceptors.response as any).handlers[0].rejected;

        await expect(rejected({ response: { status: 401 } })).rejects.toBeTruthy();

        expect(clearSpy).toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalled();
        const eventArg = dispatchSpy.mock.calls[0][0] as Event;
        expect(eventArg.type).toBe("auth:logout");
    });

    it("non-401 errors do NOT clear tokens", async () => {
        const clearSpy = vi.spyOn(tokenStorage, "clear").mockImplementation(() => { });

        const rejected = (http.interceptors.response as any).handlers[0].rejected;

        await expect(rejected({ response: { status: 500 } })).rejects.toBeTruthy();

        expect(clearSpy).not.toHaveBeenCalled();
    });
});