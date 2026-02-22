import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { getTopTags } from "../api/insights";
import type { ApiError, TopTag } from "../api/types";

function getApiErrorMessage(err: unknown): string {
    const e = err as { response?: { data?: ApiError } };
    const data = e.response?.data;
    if (!data) return "Network error. Please try again.";
    if (data.detail) return data.detail;
    if ((data as any).errors) {
        const firstKey = Object.keys((data as any).errors)[0];
        const firstMsg = (data as any).errors[firstKey]?.[0];
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
            if (sortKey === "name") return dir * (a.name || "").localeCompare(b.name || "");
            return dir * ((a.count ?? 0) - (b.count ?? 0));
        });

        return out;
    }, [tags, query, minCount, sortKey, sortDir]);

    const chartData = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
    const maxCount = useMemo(() => Math.max(1, ...chartData.map((t) => t.count ?? 0)), [chartData]);

    function goToTag(tag: string) {
        nav(`/insights?tag=${encodeURIComponent(tag)}`);
    }

    return (
        <PageShell
            title="Insight Analytics Chart"
            subtitle="Tag performance from your Insights"
            right={
                <Link to="/insights" style={styles.linkRight}>
                    ← Back to Insights
                </Link>
            }
            maxWidth={1100}
        >
            {/* Summary */}
            <section style={styles.grid4}>
                <GlassCard title="Total tag uses" value={formatCompact(stats.totalUses)} sub="Across all insights" />
                <GlassCard title="Unique tags" value={formatCompact(stats.uniqueTags)} sub="Distinct tag names" />
                <GlassCard title="Top tag" value={`#${stats.topName}`} sub="Most used tag" />
                <GlassCard title="Top tag uses" value={formatCompact(stats.topCount)} sub="Count for top tag" />
            </section>

            {/* Controls */}
            <section style={{ ...styles.card, marginTop: 14 }}>
                <div style={styles.controls}>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tags (e.g. inflation)…"
                        style={styles.input}
                    />

                    <input
                        type="number"
                        min={1}
                        value={minCount}
                        onChange={(e) => setMinCount(Math.max(1, Number(e.target.value) || 1))}
                        style={styles.input}
                        title="Minimum count"
                    />

                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={styles.input}>
                        <option value="count">Sort by count</option>
                        <option value="name">Sort by name</option>
                    </select>

                    <select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)} style={styles.input}>
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>

                    <div style={styles.controlsBottom}>
                        <span style={{ fontSize: 12, opacity: 0.75 }}>Chart items:</span>
                        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={styles.smallSelect}>
                            {[8, 12, 16, 24].map((n) => (
                                <option key={n} value={n}>
                                    Top {n}
                                </option>
                            ))}
                        </select>

                        <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
                            Showing {chartData.length} of {filtered.length} matching tags
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section style={{ marginTop: 14 }}>
                {loading && <p style={{ opacity: 0.85 }}>Loading…</p>}
                {!loading && error && <div style={styles.errorBox}>{error}</div>}

                {!loading && !error && filtered.length === 0 && (
                    <div style={styles.emptyBox}>No tags found with the current filters.</div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div style={styles.twoCol}>
                        {/* Chart */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h2 style={styles.h2}>Top Tags</h2>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>Click a bar to filter Insights</div>
                            </div>

                            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                {chartData.map((t) => {
                                    const c = t.count ?? 0;
                                    const pct = Math.max(2, Math.round((c / maxCount) * 100));
                                    return (
                                        <button
                                            key={t.name}
                                            type="button"
                                            onClick={() => goToTag(t.name)}
                                            style={styles.barRowBtn}
                                        >
                                            <div style={styles.barRowTop}>
                                                <div style={{ fontWeight: 800 }}>#{t.name}</div>
                                                <div style={{ fontSize: 12, opacity: 0.75 }}>{c}</div>
                                            </div>

                                            <div style={styles.barTrack}>
                                                <div style={{ ...styles.barFill, width: `${pct}%` }} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                                Tip: raise minimum count to focus on major topics.
                            </div>
                        </div>

                        {/* Table */}
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h2 style={styles.h2}>Tag Table</h2>
                            </div>

                            <div style={{ marginTop: 10, maxHeight: 520, overflow: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Tag</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>Count</th>
                                            <th style={{ ...styles.th, textAlign: "right" }}>Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.slice(0, 50).map((t) => {
                                            const c = t.count ?? 0;
                                            const share = stats.totalUses > 0 ? (c / stats.totalUses) * 100 : 0;
                                            return (
                                                <tr key={t.name} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                                                    <td style={styles.td}>
                                                        <button type="button" onClick={() => goToTag(t.name)} style={styles.tagLinkBtn}>
                                                            #{t.name}
                                                        </button>
                                                    </td>
                                                    <td style={{ ...styles.td, textAlign: "right" }}>{c}</td>
                                                    <td style={{ ...styles.td, textAlign: "right" }}>{share.toFixed(1)}%</td>
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
        </PageShell>
    );
}

function GlassCard({ title, value, sub }: { title: string; value: string; sub: string }) {
    return (
        <div style={styles.card}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value}</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>{sub}</div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    linkRight: {
        color: "rgba(255,255,255,0.86)",
        textDecoration: "none",
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.08)",
    },

    grid4: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
    },

    card: {
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    },

    controls: {
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 10,
    },

    controlsBottom: {
        gridColumn: "1 / -1",
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginTop: 2,
    },

    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10,16,32,0.45)",
        color: "rgba(255,255,255,0.92)",
        outline: "none",
        boxSizing: "border-box",
    },

    smallSelect: {
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10,16,32,0.45)",
        color: "rgba(255,255,255,0.92)",
        outline: "none",
    },

    twoCol: {
        display: "grid",
        gridTemplateColumns: "1.2fr 0.8fr",
        gap: 12,
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 10,
    },

    h2: { margin: 0, fontSize: 16, fontWeight: 900 },

    barRowBtn: {
        border: "none",
        padding: 0,
        background: "transparent",
        textAlign: "left",
        cursor: "pointer",
    },

    barRowTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 6,
    },

    barTrack: {
        position: "relative",
        height: 12,
        borderRadius: 999,
        background: "rgba(255,255,255,0.10)",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
    },

    barFill: {
        height: "100%",
        borderRadius: 999,
        background:
            "linear-gradient(90deg, rgba(99,102,241,0.95), rgba(16,185,129,0.80))",
    },

    th: {
        textAlign: "left",
        fontSize: 12,
        opacity: 0.75,
        padding: "10px 0",
        position: "sticky",
        top: 0,
        background: "rgba(13,18,36,0.85)",
        backdropFilter: "blur(8px)",
    },

    td: {
        padding: "10px 0",
        fontSize: 13,
        color: "rgba(255,255,255,0.90)",
    },

    tagLinkBtn: {
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        fontWeight: 800,
        color: "rgba(255,255,255,0.92)",
        textDecoration: "underline",
    },

    errorBox: {
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(244,63,94,0.35)",
        background: "rgba(244,63,94,0.10)",
        color: "rgba(255,255,255,0.92)",
    },

    emptyBox: {
        padding: 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        opacity: 0.9,
    },
};