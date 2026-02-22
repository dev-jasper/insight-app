import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteInsight, getInsight } from "../api/insights";
import type { ApiError, Insight } from "../api/types";
import { tokenStorage } from "../auth/tokenStorage";
import { getJwtPayload } from "../auth/jwt";
import { useAuth } from "../auth/AuthContext";
import PageShell from "../components/PageShell";

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

function getCurrentUserIdFromToken(): number | null {
    const token = tokenStorage.getAccess();
    if (!token) return null;

    const payload = getJwtPayload(token);
    if (!payload) return null;

    const raw = (payload as any).user_id ?? (payload as any).id ?? (payload as any).user?.id;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function formatDate(d: string) {
    try {
        return new Date(d).toLocaleString();
    } catch {
        return d;
    }
}

export default function InsightDetailPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const { isAuthenticated } = useAuth();

    const [insight, setInsight] = useState<Insight | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);

    const insightId = id ?? "";

    const isOwner = useMemo(() => {
        if (!isAuthenticated) return false;
        if (!insight?.created_by?.id) return false;
        const me = getCurrentUserIdFromToken();
        if (!me) return false;
        return me === insight.created_by.id;
    }, [isAuthenticated, insight]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");

        getInsight(insightId)
            .then((data) => {
                if (!mounted) return;
                setInsight(data);
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
    }, [insightId]);

    async function onDelete() {
        if (!insight) return;

        const ok = window.confirm("Delete this insight? This cannot be undone.");
        if (!ok) return;

        setDeleting(true);
        setError("");
        try {
            await deleteInsight(insight.id);
            nav("/insights", { replace: true });
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setDeleting(false);
        }
    }

    return (
        <PageShell
            title="Insight"
            subtitle={insight ? `#${insight.id} • ${insight.category}` : "Loading insight…"}
            right={
                <Link to="/insights" style={styles.linkRight}>
                    ← Back
                </Link>
            }
            maxWidth={980}
        >
            {loading && <div style={styles.loading}>Loading…</div>}

            {!loading && error && (
                <div style={styles.alert}>
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>Something went wrong</div>
                    <div style={{ opacity: 0.95 }}>{error}</div>
                </div>
            )}

            {!loading && !error && insight && (
                <div style={styles.card}>
                    <div style={styles.topRow}>
                        <div>
                            <h2 style={styles.title}>{insight.title}</h2>

                            <div style={styles.meta}>
                                <div>
                                    <span style={styles.metaKey}>Category</span>
                                    <span style={styles.metaVal}>{insight.category}</span>
                                </div>
                                <div>
                                    <span style={styles.metaKey}>By</span>
                                    <span style={styles.metaVal}>{insight.created_by?.username ?? "Unknown"}</span>
                                </div>
                                <div>
                                    <span style={styles.metaKey}>Created</span>
                                    <span style={styles.metaVal}>{formatDate(insight.created_at)}</span>
                                </div>
                            </div>
                        </div>

                        <div style={styles.actionsTop}>
                            {isAuthenticated && isOwner && (
                                <Link to={`/insights/${insight.id}/edit`} style={{ textDecoration: "none" }}>
                                    <button type="button" style={styles.secondaryBtn}>
                                        Edit
                                    </button>
                                </Link>
                            )}

                            {isAuthenticated && isOwner && (
                                <button type="button" onClick={onDelete} disabled={deleting} style={styles.dangerBtn}>
                                    {deleting ? "Deleting…" : "Delete"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={styles.bodyBox}>{insight.body}</div>

                    <div style={{ marginTop: 12 }}>
                        <div style={styles.smallLabel}>Tags</div>
                        <div style={styles.pills}>
                            {insight.tags?.length ? (
                                insight.tags.map((t) => (
                                    <span key={t} style={styles.pill}>
                                        #{t}
                                    </span>
                                ))
                            ) : (
                                <span style={{ opacity: 0.75 }}>No tags</span>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
                        {!isAuthenticated && "Log in to edit/delete."}
                        {isAuthenticated && !isOwner && "(You’re logged in, but not the owner — delete is hidden.)"}
                    </div>
                </div>
            )}
        </PageShell>
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

    card: {
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
    },

    topRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
    },

    title: {
        margin: 0,
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: -0.2,
        color: "rgba(255,255,255,0.94)",
    },

    meta: {
        display: "flex",
        gap: 14,
        flexWrap: "wrap",
        marginTop: 10,
    },

    metaKey: {
        display: "inline-block",
        fontSize: 12,
        opacity: 0.65,
        marginRight: 6,
    },

    metaVal: {
        fontSize: 13,
        fontWeight: 800,
        opacity: 0.95,
    },

    actionsTop: {
        display: "flex",
        gap: 10,
        alignItems: "center",
    },

    bodyBox: {
        marginTop: 14,
        whiteSpace: "pre-wrap",
        lineHeight: 1.65,
        padding: 14,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(10,16,32,0.45)",
        color: "rgba(255,255,255,0.92)",
    },

    smallLabel: {
        fontSize: 12,
        opacity: 0.7,
        fontWeight: 800,
        marginBottom: 8,
    },

    pills: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
    },

    pill: {
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        fontSize: 12,
        fontWeight: 800,
        color: "rgba(255,255,255,0.92)",
    },

    secondaryBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.92)",
        fontWeight: 900,
        cursor: "pointer",
    },

    dangerBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(244,63,94,0.35)",
        background: "rgba(244,63,94,0.14)",
        color: "rgba(255,255,255,0.95)",
        fontWeight: 900,
        cursor: "pointer",
    },

    alert: {
        borderRadius: 14,
        padding: "12px 12px",
        border: "1px solid rgba(244,63,94,0.35)",
        background: "rgba(244,63,94,0.10)",
        color: "rgba(255,255,255,0.92)",
    },

    loading: {
        padding: 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        opacity: 0.9,
    },
};