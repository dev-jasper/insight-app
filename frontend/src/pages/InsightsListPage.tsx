import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listInsights, type ListInsightsParams } from "../api/insights";
import type { Insight, Paginated } from "../api/types";
import TopNav from "../components/TopNav";
import { useAuth } from "../auth/AuthContext";
import { parseApiError } from "../api/errors";

// TODO: update to match backend exactly if needed
const CATEGORY_OPTIONS = ["", "Macro", "Equities", "FixedIncome", "Alternatives"];
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function snippet(text: string, max = 160) {
    const s = (text ?? "").replace(/\s+/g, " ").trim();
    if (s.length <= max) return s;
    return s.slice(0, max).trimEnd() + "…";
}

function clampInt(v: string | null, fallback: number) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export default function InsightsListPage() {
    const { isAuthenticated } = useAuth();

    const [sp, setSp] = useSearchParams();
    const didInitFromUrl = useRef(false);
    const skipNextUrlWrite = useRef(false);

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

    // 1) INIT: read query params -> state (runs once)
    useEffect(() => {
        if (didInitFromUrl.current) return;
        didInitFromUrl.current = true;

        // prevent immediate url write-back
        skipNextUrlWrite.current = true;

        const qSearch = sp.get("search") ?? "";
        const qTag = sp.get("tag") ?? "";
        const qCategory = sp.get("category") ?? "";
        const qOrdering = sp.get("ordering") ?? "-created_at";
        const qPage = clampInt(sp.get("page"), 1);
        const qPageSize = clampInt(sp.get("page_size"), 10);

        setSearch(qSearch);
        setTag(qTag);
        setCategory(qCategory);
        setOrdering(qOrdering);
        setPage(qPage);
        setPageSize(PAGE_SIZE_OPTIONS.includes(qPageSize) ? qPageSize : 10);
    }, [sp]);

    // 2) URL SYNC: state -> query params
    useEffect(() => {
        if (skipNextUrlWrite.current) {
            skipNextUrlWrite.current = false;
            return;
        }

        const next = new URLSearchParams();

        if (search.trim()) next.set("search", search.trim());
        if (tag.trim()) next.set("tag", tag.trim());
        if (category.trim()) next.set("category", category.trim());

        if (ordering && ordering !== "-created_at") next.set("ordering", ordering);
        if (page !== 1) next.set("page", String(page));
        if (pageSize !== 10) next.set("page_size", String(pageSize));

        setSp(next, { replace: true });
    }, [search, tag, category, ordering, page, pageSize, setSp]);

    // 3) API params
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

    // 4) Fetch
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
                setError(parseApiError(err).message);
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [params]);

    const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1;

    const resetFilters = () => {
        skipNextUrlWrite.current = true;

        setSearch("");
        setCategory("");
        setTag("");
        setOrdering("-created_at");
        setPageSize(10);
        setPage(1);

        setSp(new URLSearchParams(), { replace: true });
    };

    return (
        <div style={pageStyles.page}>
            <TopNav />

            <main style={pageStyles.main}>
                <div style={pageStyles.headerRow}>
                    <div>
                        <div style={pageStyles.kicker}>INSIGHTS</div>
                        <h1 style={pageStyles.h1}>Insights</h1>
                        <div style={pageStyles.sub}>
                            {data ? `${data.count} total` : ""}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {isAuthenticated && (
                            <Link to="/insights/new">
                                <button type="button" disabled={loading} style={pageStyles.primaryBtn}>
                                    + Create Insight
                                </button>
                            </Link>
                        )}
                        <button onClick={resetFilters} disabled={loading} style={pageStyles.ghostBtn}>
                            Reset
                        </button>
                    </div>
                </div>

                <section style={pageStyles.glassCard}>
                    <div style={pageStyles.filtersGrid}>
                        <input
                            placeholder="Search title…"
                            value={search}
                            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                            style={pageStyles.input}
                        />
                        <input
                            placeholder="Tag (e.g. Inflation)"
                            value={tag}
                            onChange={(e) => { setPage(1); setTag(e.target.value); }}
                            style={pageStyles.input}
                        />

                        <select
                            value={category}
                            onChange={(e) => { setPage(1); setCategory(e.target.value); }}
                            style={pageStyles.input}
                        >
                            {CATEGORY_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                    {c === "" ? "All categories" : c}
                                </option>
                            ))}
                        </select>

                        <select
                            value={ordering}
                            onChange={(e) => { setPage(1); setOrdering(e.target.value); }}
                            style={pageStyles.input}
                        >
                            <option value="-created_at">Newest</option>
                            <option value="created_at">Oldest</option>
                            <option value="title">Title A-Z</option>
                            <option value="-title">Title Z-A</option>
                        </select>

                        <select
                            value={pageSize}
                            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                            style={pageStyles.input}
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    Page size: {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                <section style={{ marginTop: 14 }}>
                    {loading && <div style={pageStyles.muted}>Loading…</div>}
                    {!loading && error && <div style={pageStyles.error}>{error}</div>}
                    {!loading && !error && data && data.results.length === 0 && (
                        <div style={pageStyles.muted}>No insights found.</div>
                    )}

                    {!loading && !error && data && data.results.length > 0 && (
                        <div style={{ display: "grid", gap: 10 }}>
                            {data.results.map((it) => (
                                <div key={it.id} style={pageStyles.itemCard}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <Link to={`/insights/${it.id}`} style={pageStyles.itemTitle}>
                                                {it.title}
                                            </Link>
                                            <div style={pageStyles.preview}>
                                                {snippet(it.body, 180)}
                                            </div>

                                            <div style={pageStyles.meta}>
                                                <span style={pageStyles.pill}>{it.category}</span>
                                                <span style={{ opacity: 0.75 }}>
                                                    by <b style={{ color: "rgba(255,255,255,0.9)" }}>{it.created_by?.username}</b>
                                                </span>
                                            </div>

                                            <div style={pageStyles.tags}>
                                                {it.tags.map((t) => (
                                                    <span key={t} style={pageStyles.tagPill}>#{t}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ opacity: 0.65, fontSize: 12, whiteSpace: "nowrap" }}>
                                            ID: {it.id}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div style={pageStyles.pagination}>
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={!data.previous || page === 1 || loading}
                                    style={pageStyles.pageBtn}
                                >
                                    Prev
                                </button>

                                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                                    Page <b>{page}</b> / <b>{totalPages}</b>
                                </div>

                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!data.next || loading}
                                    style={pageStyles.pageBtn}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

const pageStyles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,.14), transparent 55%), #0b1020",
    },
    main: {
        padding: 24,
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        maxWidth: 980,
        margin: "0 auto",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 12,
        marginTop: 10,
    },
    kicker: {
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: 0.8,
        color: "rgba(255,255,255,0.65)",
    },
    h1: { margin: "6px 0 4px", fontSize: 34, color: "white", lineHeight: 1.1 },
    sub: { fontSize: 12, opacity: 0.75, color: "rgba(255,255,255,0.75)" },

    glassCard: {
        marginTop: 16,
        padding: 12,
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
    },
    filtersGrid: {
        display: "grid",
        gap: 10,
        gridTemplateColumns: "1fr 1fr",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(15,23,42,0.35)",
        color: "rgba(255,255,255,0.92)",
        outline: "none",
    },

    primaryBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 900,
        cursor: "pointer",
    },
    ghostBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "transparent",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 800,
        cursor: "pointer",
    },

    muted: { color: "rgba(255,255,255,0.75)", padding: "10px 0" },
    error: {
        color: "#fecaca",
        background: "rgba(244,63,94,0.10)",
        border: "1px solid rgba(244,63,94,0.25)",
        padding: 12,
        borderRadius: 12,
    },

    itemCard: {
        padding: 14,
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
    },
    itemTitle: {
        display: "inline-block",
        fontSize: 16,
        fontWeight: 900,
        color: "rgba(226,232,240,0.95)", // softer than pure white
        textDecoration: "none",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: 640,
    },
    meta: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginTop: 8,
        color: "rgba(255,255,255,0.75)",
        fontSize: 13,
    },
    pill: {
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(99,102,241,0.18)",
        border: "1px solid rgba(99,102,241,0.22)",
        color: "rgba(255,255,255,0.9)",
        fontWeight: 800,
        fontSize: 12,
    },
    tags: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 },
    tagPill: {
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.82)",
        fontSize: 12,
    },

    pagination: {
        marginTop: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    pageBtn: {
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 800,
        cursor: "pointer",
    },
    preview: {
        marginTop: 8,
        color: "rgba(226,232,240,0.75)",
        fontSize: 13,
        lineHeight: 1.45,
    },
};