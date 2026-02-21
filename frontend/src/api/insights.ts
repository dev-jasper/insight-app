import { http } from "./http";
import { PaginatedResponse, Insight, TopTag } from "../types/api";

export async function fetchInsights(params?: {
    search?: string;
    category?: string;
    tag?: string;
    page?: number;
}) {
    const response = await http.get<PaginatedResponse<Insight>>(
        "/insights/",
        { params }
    );

    return response.data;
}

export async function fetchTopTags() {
    const response = await http.get<TopTag[]>("/analytics/top-tags/");
    return response.data;
}