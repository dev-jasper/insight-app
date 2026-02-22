import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNav from "../components/TopNav";
import { getTopTags } from "../api/insights";
import type { ApiError, TopTag } from "../api/types";

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

type SortKey = "count" | "name";
type SortDir = "asc" | "desc";

function formatCompact(n: number) {
    return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

export default function AnalyticsPage() {
    const nav = useNavigate();

    const [tags, setTags] = useState<TopTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // UI controls
    const [query, setQuery] = useState("");
    const [minCount, setMinCount] = useState<number>(1);
    const [sortKey, setSortKey] = useState<SortKey>("count");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [limit, setLimit] = useState<number>(12);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");

        getTopTags()
            .then((res) => {
                if (!mounted) return;
                setTags(res.tags ?? []);
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
    }, []);

    const stats = useMemo(() => {
        const totalUses = tags.reduce((sum, t) => sum + (t.count || 0), 0);
        const uniqueTags = tags.length;
        const top = tags.slice().sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0];
        return {
            totalUses,
            uniqueTags,
            topName: top?.name ?? "—",
            topCount: top?.count ?? 0,
        };
    }, [tags]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let out = tags.filter((t) => {
            const okQ = !q || (t.name || "").toLowerCase().includes(q);
            const okMin = (t.count ?? 0) >= minCount;
            return okQ && okMin;
        });

        out.sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            if (sortKey === "name") {
                return dir * (a.name || "").localeCompare(b.name || "");
            }
            return dir * ((a.count ?? 0) - (b.count ?? 0));
        });

        return out;
    }, [tags, query, minCount, sortKey, sortDir]);

    const chartData = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
    const maxCount = useMemo(
        () => Math.max(1, ...chartData.map((t) => t.count ?? 0)),
        [chartData]
    );

    function goToTag(tag: string) {
        nav(`/insights?tag=${encodeURIComponent(tag)}`);
    }

    return (
        <>
            <TopNav />

            <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1100, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Analytics</h1>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                            Tag performance from your Insights
                        </div>
                    </div>

                    <Link to="/insights" style={{ fontSize: 14 }}>
                        ← Back to Insights
                    </Link>
                </div>

                {/* Summary cards */}
                <section
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: 12,
                        marginTop: 16,
                    }}
                >
                    <Card title="Total tag uses" value={formatCompact(stats.totalUses)} sub="Across all insights" />
                    <Card title="Unique tags" value={formatCompact(stats.uniqueTags)} sub="Distinct tag names" />
                    <Card title="Top tag" value={stats.topName} sub="Most used tag" />
                    <Card title="Top tag uses" value={formatCompact(stats.topCount)} sub="Count for top tag" />
                </section>

                {/* Controls */}
                <section
                    style={{
                        marginTop: 16,
                        padding: 14,
                        border: "1px solid #eee",
                        borderRadius: 12,
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: 10,
                    }}
                >
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tags (e.g. inflation)…"
                        style={{ padding: 10 }}
                    />

                    <input
                        type="number"
                        min={1}
                        value={minCount}
                        onChange={(e) => setMinCount(Math.max(1, Number(e.target.value) || 1))}
                        style={{ padding: 10 }}
                        title="Minimum count"
                    />

                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={{ padding: 10 }}>
                        <option value="count">Sort by count</option>
                        <option value="name">Sort by name</option>
                    </select>

                    <select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)} style={{ padding: 10 }}>
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>

                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
                        <label style={{ fontSize: 12, opacity: 0.8 }}>Chart items:</label>
                        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ padding: 8 }}>
                            {[8, 12, 16, 24].map((n) => (
                                <option key={n} value={n}>
                                    Top {n}
                                </option>
                            ))}
                        </select>

                        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
                            Showing {chartData.length} of {filtered.length} matching tags
                        </div>
                    </div>
                </section>

                {/* Content */}
                <section style={{ marginTop: 16 }}>
                    {loading && <p>Loading…</p>}
                    {!loading && error && <p style={{ color: "crimson" }}>{error}</p>}

                    {!loading && !error && filtered.length === 0 && (
                        <p style={{ opacity: 0.8 }}>No tags found with the current filters.</p>
                    )}

                    {!loading && !error && filtered.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
                            {/* Chart */}
                            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <h2 style={{ margin: 0, fontSize: 16 }}>Top Tags</h2>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                                        Click a bar to filter Insights
                                    </div>
                                </div>

                                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                    {chartData.map((t) => {
                                        const c = t.count ?? 0;
                                        const pct = Math.max(2, Math.round((c / maxCount) * 100)); // keep visible
                                        return (
                                            <button
                                                key={t.name}
                                                type="button"
                                                onClick={() => goToTag(t.name)}
                                                title="Open Insights filtered by this tag"
                                                style={{
                                                    border: "none",
                                                    padding: 0,
                                                    background: "transparent",
                                                    textAlign: "left",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                                                    <div style={{ fontWeight: 700 }}>#{t.name}</div>
                                                    <div style={{ fontSize: 12, opacity: 0.8 }}>{c}</div>
                                                </div>

                                                <div
                                                    style={{
                                                        position: "relative",
                                                        height: 12,
                                                        borderRadius: 999,
                                                        background: "#f2f2f2",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${pct}%`,
                                                            height: "100%",
                                                            borderRadius: 999,
                                                            background: "linear-gradient(90deg, #111, #666)",
                                                        }}
                                                    />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                                    Tip: change sorting to see long-tail tags, or raise minimum count to focus on major topics.
                                </div>
                            </div>

                            {/* Table */}
                            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
                                <h2 style={{ margin: 0, fontSize: 16 }}>Tag Table</h2>

                                <div style={{ marginTop: 10, maxHeight: 520, overflow: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr>
                                                <th style={thStyle}>Tag</th>
                                                <th style={{ ...thStyle, textAlign: "right" }}>Count</th>
                                                <th style={{ ...thStyle, textAlign: "right" }}>Share</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.slice(0, 50).map((t) => {
                                                const c = t.count ?? 0;
                                                const share =
                                                    stats.totalUses > 0 ? (c / stats.totalUses) * 100 : 0;
                                                return (
                                                    <tr
                                                        key={t.name}
                                                        style={{ borderTop: "1px solid #f0f0f0" }}
                                                    >
                                                        <td style={tdStyle}>
                                                            <button
                                                                type="button"
                                                                onClick={() => goToTag(t.name)}
                                                                style={{
                                                                    border: "none",
                                                                    background: "transparent",
                                                                    padding: 0,
                                                                    cursor: "pointer",
                                                                    fontWeight: 700,
                                                                    textDecoration: "underline",
                                                                }}
                                                            >
                                                                #{t.name}
                                                            </button>
                                                        </td>
                                                        <td style={{ ...tdStyle, textAlign: "right" }}>{c}</td>
                                                        <td style={{ ...tdStyle, textAlign: "right" }}>
                                                            {share.toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {filtered.length > 50 && (
                                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                                        Showing first 50 rows (filter/search to narrow down).
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
    return (
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>{value}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{sub}</div>
        </div>
    );
}

const thStyle: React.CSSProperties = {
    textAlign: "left",
    fontSize: 12,
    opacity: 0.75,
    padding: "8px 0",
    position: "sticky",
    top: 0,
    background: "white",
};

const tdStyle: React.CSSProperties = {
    padding: "10px 0",
    fontSize: 13,
};