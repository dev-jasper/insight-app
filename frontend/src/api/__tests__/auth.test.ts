import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginApi, meApi, logoutApi } from "../auth";

vi.mock("../http", () => {
    return {
        http: {
            get: vi.fn(),
            post: vi.fn(),
        },
    };
});

import { http } from "../http";

describe("api/auth", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("loginApi calls POST /api/auth/login and returns data", async () => {
        const payload = { username: "a", password: "b" };
        const mockData = { access: "acc", refresh: "ref" };
        (http.post as any).mockResolvedValueOnce({ data: mockData });

        const data = await loginApi(payload);

        expect(http.post).toHaveBeenCalledWith("/api/auth/login", payload);
        expect(data).toBe(mockData);
    });

    it("meApi calls GET /api/auth/me and returns data", async () => {
        const mockData = { id: 1, username: "jasper" };
        (http.get as any).mockResolvedValueOnce({ data: mockData });

        const data = await meApi();

        expect(http.get).toHaveBeenCalledWith("/api/auth/me");
        expect(data).toBe(mockData);
    });

    it("logoutApi calls POST /api/auth/logout", async () => {
        (http.post as any).mockResolvedValueOnce({ data: null });

        await logoutApi();

        expect(http.post).toHaveBeenCalledWith("/api/auth/logout");
    });
});