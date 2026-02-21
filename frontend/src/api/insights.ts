import { http } from "./http";
import type { Insight, Paginated, TopTagsResponse } from "./types";

export type ListInsightsParams = {
    search?: string;
    category?: string;
    tag?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
};

export async function listInsights(params: ListInsightsParams) {
    const res = await http.get<Paginated<Insight>>("/api/insights/", { params });
    return res.data;
}

export async function getTopTags() {
    const res = await http.get<TopTagsResponse>("/api/analytics/top-tags/");
    return res.data;
}