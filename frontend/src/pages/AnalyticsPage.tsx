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

            <div style={styles.page}>
                <main style={styles.main}>
                    {/* Header */}
                    <div style={styles.headerRow}>
                        <div>
                            <div style={styles.kicker}>ANALYTICS</div>
                            <h1 style={styles.h1}>Tag performance</h1>
                            <div style={styles.sub}>
                                Track the most-used tags across your insights.
                            </div>
                        </div>

                        <Link to="/insights" style={styles.backLink}>
                            ← Back to Insights
                        </Link>
                    </div>

                    {/* Error */}
                    {!loading && error && (
                        <div style={styles.alert}>
                            <div style={styles.alertTitle}>Something went wrong</div>
                            <div style={styles.alertBody}>{error}</div>
                        </div>
                    )}

                    {/* Summary cards */}
                    <section style={styles.cards}>
                        <StatCard title="Total tag uses" value={formatCompact(stats.totalUses)} sub="Across all insights" />
                        <StatCard title="Unique tags" value={formatCompact(stats.uniqueTags)} sub="Distinct tag names" />
                        <StatCard title="Top tag" value={`#${stats.topName}`} sub="Most used tag" />
                        <StatCard title="Top tag uses" value={formatCompact(stats.topCount)} sub="Count for top tag" />
                    </section>

                    {/* Controls */}
                    <section style={styles.panel}>
                        <div style={styles.panelHeader}>
                            <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Filters</div>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>
                                Showing <b>{chartData.length}</b> of <b>{filtered.length}</b> matching tags
                            </div>
                        </div>

                        <div style={styles.controlsGrid}>
                            <Field label="Search tags">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="e.g. inflation"
                                    style={styles.input}
                                />
                            </Field>

                            <Field label="Min count">
                                <input
                                    type="number"
                                    min={1}
                                    value={minCount}
                                    onChange={(e) => setMinCount(Math.max(1, Number(e.target.value) || 1))}
                                    style={styles.input}
                                />
                            </Field>

                            <Field label="Sort">
                                <select
                                    value={sortKey}
                                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                                    style={styles.input}
                                >
                                    <option value="count">Count</option>
                                    <option value="name">Name</option>
                                </select>
                            </Field>

                            <Field label="Direction">
                                <select
                                    value={sortDir}
                                    onChange={(e) => setSortDir(e.target.value as SortDir)}
                                    style={styles.input}
                                >
                                    <option value="desc">Descending</option>
                                    <option value="asc">Ascending</option>
                                </select>
                            </Field>

                            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center" }}>
                                <span style={{ fontSize: 12, opacity: 0.75 }}>Chart items</span>
                                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={styles.smallSelect}>
                                    {[8, 12, 16, 24].map((n) => (
                                        <option key={n} value={n}>
                                            Top {n}
                                        </option>
                                    ))}
                                </select>

                                <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.75 }}>
                                    Tip: click a bar to open Insights filtered by that tag.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Content */}
                    <section style={{ marginTop: 14 }}>
                        {loading && <div style={{ color: "rgba(255,255,255,0.8)" }}>Loading…</div>}

                        {!loading && !error && filtered.length === 0 && (
                            <div style={{ color: "rgba(255,255,255,0.75)" }}>
                                No tags found with the current filters.
                            </div>
                        )}

                        {!loading && !error && filtered.length > 0 && (
                            <div style={styles.twoCol}>
                                {/* Chart */}
                                <div style={styles.panel}>
                                    <div style={styles.panelHeader}>
                                        <div style={{ fontWeight: 900 }}>Top Tags</div>
                                        <div style={{ fontSize: 12, opacity: 0.75 }}>Click a bar to filter Insights</div>
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
                                                    title="Open Insights filtered by this tag"
                                                >
                                                    <div style={styles.barRowTop}>
                                                        <div style={styles.tagName}>#{t.name}</div>
                                                        <div style={styles.tagCount}>{c}</div>
                                                    </div>

                                                    <div style={styles.track}>
                                                        <div style={{ ...styles.fill, width: `${pct}%` }} />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
                                        Tip: raise minimum count to focus on major topics.
                                    </div>
                                </div>

                                {/* Table */}
                                <div style={styles.panel}>
                                    <div style={styles.panelHeader}>
                                        <div style={{ fontWeight: 900 }}>Tag Table</div>
                                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                                            Sorted by {sortKey} ({sortDir})
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 10, maxHeight: 520, overflow: "auto" }}>
                                        <table style={styles.table}>
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
                                                        <tr key={t.name} style={styles.tr}>
                                                            <td style={styles.td}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => goToTag(t.name)}
                                                                    style={styles.tableLink}
                                                                >
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
                                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                                            Showing first 50 rows (filter/search to narrow down).
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>{label}</div>
            {children}
        </div>
    );
}

function StatCard({ title, value, sub }: { title: string; value: string; sub: string }) {
    return (
        <div style={styles.statCard}>
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>{title}</div>
            <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6, color: "white" }}>{value}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{sub}</div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "calc(100vh - 0px)",
        background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,.14), transparent 55%), #0b1020",
        paddingBottom: 34,
    },
    main: {
        padding: 24,
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        maxWidth: 1100,
        margin: "0 auto",
        color: "rgba(255,255,255,0.88)",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
    },
    kicker: {
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 0.8,
        opacity: 0.75,
    },
    h1: {
        margin: "6px 0 4px",
        fontSize: 34,
        lineHeight: 1.05,
        color: "white",
    },
    sub: {
        fontSize: 13,
        opacity: 0.75,
    },
    backLink: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
        textDecoration: "none",
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.08)",
    },
    alert: {
        marginTop: 14,
        borderRadius: 14,
        padding: "10px 12px",
        border: "1px solid rgba(244,63,94,0.35)",
        background: "rgba(244,63,94,0.10)",
        color: "rgba(255,255,255,0.92)",
    },
    alertTitle: { fontWeight: 900, fontSize: 13, marginBottom: 2 },
    alertBody: { fontSize: 13, opacity: 0.9 },
    cards: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
        marginTop: 16,
    },
    statCard: {
        borderRadius: 16,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.07)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.30)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
    },
    panel: {
        marginTop: 14,
        borderRadius: 16,
        padding: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
    },
    panelHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 10,
    },
    controlsGrid: {
        marginTop: 12,
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 10,
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(15,23,42,0.35)",
        color: "rgba(255,255,255,0.92)",
        outline: "none",
        fontSize: 14,
        boxSizing: "border-box",
    },
    smallSelect: {
        padding: "8px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(15,23,42,0.35)",
        color: "rgba(255,255,255,0.92)",
        outline: "none",
        fontSize: 13,
    },
    twoCol: {
        display: "grid",
        gridTemplateColumns: "1.15fr 0.85fr",
        gap: 12,
        alignItems: "start",
    },
    barRowBtn: {
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 14,
        padding: 12,
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
    },
    barRowTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 8,
    },
    tagName: { fontWeight: 900, letterSpacing: 0.2 },
    tagCount: { fontSize: 12, opacity: 0.8 },
    track: {
        height: 12,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.10)",
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        borderRadius: 999,
        background:
            "linear-gradient(90deg, rgba(99,102,241,0.95), rgba(16,185,129,0.85))",
        boxShadow: "0 8px 24px rgba(99,102,241,0.25)",
    },
    table: {
        width: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
    },
    th: {
        textAlign: "left",
        fontSize: 12,
        opacity: 0.8,
        padding: "10px 10px",
        position: "sticky",
        top: 0,
        background: "rgba(11,16,32,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
    },
    tr: {
        borderTop: "1px solid rgba(255,255,255,0.08)",
    },
    td: {
        padding: "10px 10px",
        fontSize: 13,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    tableLink: {
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        fontWeight: 900,
        color: "rgba(255,255,255,0.92)",
        textDecoration: "underline",
    },
};