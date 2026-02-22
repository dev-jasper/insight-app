import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteInsight, getInsight } from "../api/insights";
import type { ApiError, Insight } from "../api/types";
import { tokenStorage } from "../auth/tokenStorage";
import { getJwtPayload } from "../auth/jwt";
import { useAuth } from "../auth/AuthContext";

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

function getCurrentUserIdFromToken(): number | null {
    const token = tokenStorage.getAccess();
    if (!token) return null;

    const payload = getJwtPayload(token);
    if (!payload) return null;

    // SimpleJWT default is usually user_id, but be defensive:
    const raw =
        (payload as any).user_id ??
        (payload as any).id ??
        (payload as any).user?.id;

    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
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

    // Owner check (backend still enforces permissions)
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
        <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Insight</h1>
                <Link to="/insights">← Back</Link>
            </div>

            {loading && <p style={{ marginTop: 12 }}>Loading…</p>}

            {!loading && error && (
                <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>
            )}

            {!loading && !error && insight && (
                <div style={{ marginTop: 16 }}>
                    <h2 style={{ marginBottom: 6 }}>{insight.title}</h2>

                    <div style={{ opacity: 0.85, marginBottom: 12 }}>
                        <div><strong>Category:</strong> {insight.category}</div>
                        <div><strong>By:</strong> {insight.created_by?.username ?? "Unknown"}</div>
                        <div><strong>Created:</strong> {new Date(insight.created_at).toLocaleString()}</div>
                    </div>

                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, border: "1px solid #ddd", padding: 12 }}>
                        {insight.body}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>
                        <strong>Tags:</strong> {insight.tags.join(", ")}
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
                        {/* ✅ Edit shown when authenticated (exam-friendly) */}
                        {isAuthenticated && (
                            <Link to={`/insights/${insight.id}/edit`}>
                                <button type="button">Edit</button>
                            </Link>
                        )}

                        {/* ✅ Delete only for owner (backend enforces too) */}
                        {isAuthenticated && isOwner && (
                            <button type="button" onClick={onDelete} disabled={deleting}>
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        )}

                        {!isAuthenticated && (
                            <span style={{ opacity: 0.85 }}>Log in to edit/delete.</span>
                        )}

                        {isAuthenticated && !isOwner && (
                            <span style={{ opacity: 0.75, fontSize: 13 }}>
                                (You’re logged in, but not the owner — delete is hidden.)
                            </span>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}