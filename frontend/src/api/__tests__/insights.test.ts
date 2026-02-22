import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    listInsights,
    getTopTags,
    createInsight,
    getInsight,
    updateInsight,
    deleteInsight,
} from "../insights";

// Mock the axios instance module used by insights.ts
vi.mock("../http", () => {
    return {
        http: {
            get: vi.fn(),
            post: vi.fn(),
            patch: vi.fn(),
            delete: vi.fn(),
        },
    };
});

import { http } from "../http";

describe("api/insights", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("listInsights calls GET /api/insights/ with params and returns data", async () => {
        const mockData = { count: 1, next: null, previous: null, results: [] };
        (http.get as any).mockResolvedValueOnce({ data: mockData });

        const params = { search: "abc", page: 2, page_size: 10 };
        const data = await listInsights(params);

        expect(http.get).toHaveBeenCalledWith("/api/insights/", { params });
        expect(data).toBe(mockData);
    });

    it("getTopTags calls GET /api/analytics/top-tags/ and returns data", async () => {
        const mockData = { results: [{ tag: "x", count: 2 }] };
        (http.get as any).mockResolvedValueOnce({ data: mockData });

        const data = await getTopTags();

        expect(http.get).toHaveBeenCalledWith("/api/analytics/top-tags/");
        expect(data).toBe(mockData);
    });

    it("createInsight calls POST /api/insights/ and returns data", async () => {
        const payload = { title: "t", category: "c", body: "b", tags: ["a"] };
        const mockData = { id: 1, ...payload, created_by: { id: 1, username: "u" }, created_at: "", updated_at: "" };
        (http.post as any).mockResolvedValueOnce({ data: mockData });

        const data = await createInsight(payload);

        expect(http.post).toHaveBeenCalledWith("/api/insights/", payload);
        expect(data).toBe(mockData);
    });

    it("getInsight calls GET /api/insights/:id/ and returns data", async () => {
        const mockData = { id: 123, title: "t", category: "c", body: "b", tags: [], created_by: { id: 1, username: "u" }, created_at: "", updated_at: "" };
        (http.get as any).mockResolvedValueOnce({ data: mockData });

        const data = await getInsight(123);

        expect(http.get).toHaveBeenCalledWith("/api/insights/123/");
        expect(data).toBe(mockData);
    });

    it("updateInsight calls PATCH /api/insights/:id/ and returns data", async () => {
        const payload = { title: "new" };
        const mockData = { id: 5, title: "new", category: "c", body: "b", tags: [], created_by: { id: 1, username: "u" }, created_at: "", updated_at: "" };
        (http.patch as any).mockResolvedValueOnce({ data: mockData });

        const data = await updateInsight("5", payload);

        expect(http.patch).toHaveBeenCalledWith("/api/insights/5/", payload);
        expect(data).toBe(mockData);
    });

    it("deleteInsight calls DELETE /api/insights/:id/", async () => {
        (http.delete as any).mockResolvedValueOnce({});

        await deleteInsight(9);

        expect(http.delete).toHaveBeenCalledWith("/api/insights/9/");
    });
});