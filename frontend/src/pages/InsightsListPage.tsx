import { useEffect, useMemo, useState } from "react";
import { listInsights, type ListInsightsParams } from "../api/insights";
import type { ApiError, Insight, Paginated } from "../api/types";
import { Link } from "react-router-dom";

// TODO: update to match backend exactly if needed
const CATEGORY_OPTIONS = ["", "Macro", "Equities", "FixedIncome", "Alternatives"];

function getApiErrorMessage(err: unknown): string {
    const e = err as { response?: { data?: ApiError } };
    const data = e.response?.data;
    if (!data) return "Network error. Please try again.";
    if (data.detail) return data.detail;
    if (data.errors) {
        const firstKey = Object.keys(data.errors)[0];
        const firstMsg = data.errors[firstKey]?.[0];
        if (firstKey && firstMsg) return `${firstKey}: ${firstMsg}`;
    }
    return "Request failed. Please try again.";
}

export default function InsightsListPage() {
    const [data, setData] = useState<Paginated<Insight> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    // filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [tag, setTag] = useState("");
    const [ordering, setOrdering] = useState("-created_at");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const params: ListInsightsParams = useMemo(
        () => ({
            search: search.trim() || undefined,
            category: category.trim() || undefined,
            tag: tag.trim() || undefined,
            ordering: ordering || undefined,
            page,
            page_size: pageSize,
        }),
        [search, category, tag, ordering, page, pageSize]
    );

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");

        listInsights(params)
            .then((res) => {
                if (!mounted) return;
                setData(res);
            })
            .catch((err) => {
                if (!mounted) return;
                setError(getApiErrorMessage(err));
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [params]);

    const totalPages =
        data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1;

    const resetFilters = () => {
        setSearch("");
        setCategory("");
        setTag("");
        setOrdering("-created_at");
        setPageSize(10);
        setPage(1);
    };

    return (
        <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Insights</h1>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {data ? `${data.count} total` : ""}
                    </div>
                </div>

                <button onClick={resetFilters} disabled={loading} style={{ padding: "8px 12px" }}>
                    Reset
                </button>
            </div>

            {/* Filters */}
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
                <input
                    placeholder="Search (title)..."
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                    style={{ padding: 10 }}
                />

                <input
                    placeholder="Tag (e.g. Inflation)"
                    value={tag}
                    onChange={(e) => {
                        setPage(1);
                        setTag(e.target.value);
                    }}
                    style={{ padding: 10 }}
                />

                <select
                    value={category}
                    onChange={(e) => {
                        setPage(1);
                        setCategory(e.target.value);
                    }}
                    style={{ padding: 10 }}
                >
                    {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                            {c === "" ? "All categories" : c}
                        </option>
                    ))}
                </select>

                <select
                    value={ordering}
                    onChange={(e) => {
                        setPage(1);
                        setOrdering(e.target.value);
                    }}
                    style={{ padding: 10 }}
                >
                    <option value="-created_at">Newest</option>
                    <option value="created_at">Oldest</option>
                    <option value="title">Title A-Z</option>
                    <option value="-title">Title Z-A</option>
                </select>

                <select
                    value={pageSize}
                    onChange={(e) => {
                        setPage(1);
                        setPageSize(Number(e.target.value));
                    }}
                    style={{ padding: 10 }}
                >
                    {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                            Page size: {n}
                        </option>
                    ))}
                </select>
            </div>

            {/* Content */}
            <div style={{ marginTop: 16 }}>
                {loading && <p>Loading…</p>}

                {!loading && error && <p style={{ color: "crimson" }}>{error}</p>}

                {!loading && !error && data && data.results.length === 0 && (
                    <p>No insights found.</p>
                )}

                {!loading && !error && data && data.results.length > 0 && (
                    <>
                        <ul style={{ paddingLeft: 18 }}>
                            {data.results.map((it) => (
                                <li key={it.id} style={{ marginBottom: 14 }}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                                        <Link to={`/insights/${it.id}`}><strong>{it.title}</strong></Link>
                                        <em>({it.category})</em>
                                        <span style={{ opacity: 0.8 }}>by {it.created_by?.username}</span>
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                                        Tags: {it.tags.join(", ")}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={!data.previous || page === 1 || loading}
                            >
                                Prev
                            </button>

                            <span>
                                Page <b>{page}</b> / <b>{totalPages}</b>
                            </span>

                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={!data.next || loading}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}