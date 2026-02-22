import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getInsight, updateInsight } from "../api/insights";
import type { ApiError, Insight } from "../api/types";
import PageShell from "../components/PageShell";
import { parseApiError } from "../api/errors";

const CATEGORY_OPTIONS = ["Macro", "Equities", "FixedIncome", "Alternatives"];

const TITLE_MIN = 5;
const TITLE_MAX = 200;
const BODY_MIN = 20;
const TAG_MIN = 1;
const TAG_MAX = 10;

type FieldErrors = Partial<Record<"title" | "category" | "body" | "tags", string>>;

function normalizeTag(raw: string) {
    return raw.trim().replace(/^#/, "");
}

export default function InsightEditPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const insightId = id ?? "";

    const [initial, setInitial] = useState<Insight | null>(null);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0] ?? "");
    const [body, setBody] = useState("");

    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setFormError("");

        getInsight(insightId)
            .then((data) => {
                if (!mounted) return;
                setInitial(data);
                setTitle(data.title ?? "");
                setCategory(data.category ?? (CATEGORY_OPTIONS[0] ?? ""));
                setBody(data.body ?? "");
                setTags(Array.isArray(data.tags) ? data.tags : []);
            })
            .catch((err) => {
                if (!mounted) return;
                const parsed = parseApiError(err);
                setFormError(parsed.message || "Failed to load insight.");
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [insightId]);

    const titleErr = useMemo(() => {
        const v = title.trim();
        if (!v) return "Title is required.";
        if (v.length < TITLE_MIN) return `Title must be at least ${TITLE_MIN} characters.`;
        if (v.length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters.`;
        return "";
    }, [title]);

    const bodyErr = useMemo(() => {
        const v = body.trim();
        if (!v) return "Body is required.";
        if (v.length < BODY_MIN) return `Body must be at least ${BODY_MIN} characters.`;
        return "";
    }, [body]);

    const categoryErr = useMemo(() => (!category ? "Category is required." : ""), [category]);

    const tagsErr = useMemo(() => {
        if (tags.length < TAG_MIN) return `At least ${TAG_MIN} tag is required.`;
        if (tags.length > TAG_MAX) return `At most ${TAG_MAX} tags allowed.`;
        const lower = tags.map((t) => t.toLowerCase());
        if (new Set(lower).size !== lower.length) return "Tags must not contain duplicates.";
        return "";
    }, [tags]);

    const isValid = !titleErr && !bodyErr && !categoryErr && !tagsErr;

    function addTag() {
        const v = normalizeTag(tagInput);
        if (!v) return;

        const exists = tags.some((t) => t.toLowerCase() === v.toLowerCase());
        if (exists) {
            setTagInput("");
            return;
        }
        if (tags.length >= TAG_MAX) return;

        setTags((prev) => [...prev, v]);
        setTagInput("");
    }

    function removeTag(t: string) {
        setTags((prev) => prev.filter((x) => x !== t));
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError("");
        setFieldErrors({});

        const clientFields: FieldErrors = {};
        if (titleErr) clientFields.title = titleErr;
        if (categoryErr) clientFields.category = categoryErr;
        if (bodyErr) clientFields.body = bodyErr;
        if (tagsErr) clientFields.tags = tagsErr;

        if (Object.keys(clientFields).length > 0) {
            setFieldErrors(clientFields);
            return;
        }

        setSubmitting(true);
        try {
            const updated = await updateInsight(insightId, {
                title: title.trim(),
                category,
                body: body.trim(),
                tags,
            });
            nav(`/insights/${updated.id}`, { replace: true });
        } catch (err) {
            const parsed = parseApiError(err);
            setFormError(parsed.message || "Save failed. Please try again.");

            const fe: FieldErrors = {};
            const be = parsed.fieldErrors as any;
            if (be?.title?.[0]) fe.title = be.title[0];
            if (be?.category?.[0]) fe.category = be.category[0];
            if (be?.body?.[0]) fe.body = be.body[0];
            if (be?.tags?.[0]) fe.tags = be.tags[0];
            setFieldErrors(fe);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <PageShell
            title="Edit Insight"
            subtitle={initial ? `Editing: ${initial.title}` : "Loading…"}
            right={
                <Link to={initial ? `/insights/${initial.id}` : "/insights"} style={styles.linkRight}>
                    ← Back
                </Link>
            }
            maxWidth={980}
        >
            {loading && <div style={styles.loading}>Loading…</div>}

            {formError && (
                <div style={styles.alert}>
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>Save failed</div>
                    <div style={{ opacity: 0.95 }}>{formError}</div>
                </div>
            )}

            {!loading && initial && (
                <div style={styles.card}>
                    <form onSubmit={onSubmit} style={styles.form}>
                        {/* Title */}
                        <div style={styles.field}>
                            <label style={styles.label}>Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="5–200 characters"
                                style={{ ...styles.input, ...(fieldErrors.title ? styles.inputError : null) }}
                            />
                            <div style={styles.hint}>
                                {title.trim().length}/{TITLE_MAX}
                            </div>
                            {(fieldErrors.title || titleErr) && (
                                <div style={styles.fieldError}>{fieldErrors.title || titleErr}</div>
                            )}
                        </div>

                        {/* Category */}
                        <div style={styles.field}>
                            <label style={styles.label}>Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{ ...styles.input, ...(fieldErrors.category ? styles.inputError : null) }}
                            >
                                {CATEGORY_OPTIONS.map((c) => (
                                    <option key={c} value={c} style={{ color: "#0f172a" }}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            {(fieldErrors.category || categoryErr) && (
                                <div style={styles.fieldError}>{fieldErrors.category || categoryErr}</div>
                            )}
                        </div>

                        {/* Body */}
                        <div style={styles.field}>
                            <label style={styles.label}>Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder={`Minimum ${BODY_MIN} characters`}
                                style={{ ...styles.textarea, ...(fieldErrors.body ? styles.inputError : null) }}
                            />
                            {(fieldErrors.body || bodyErr) && (
                                <div style={styles.fieldError}>{fieldErrors.body || bodyErr}</div>
                            )}
                        </div>

                        {/* Tags */}
                        <div style={styles.field}>
                            <label style={styles.label}>Tags</label>

                            <div style={styles.tagRow}>
                                <input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Type a tag then press Add (or Enter)"
                                    style={{ ...styles.input, flex: 1 }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    disabled={!tagInput.trim() || tags.length >= TAG_MAX}
                                    style={styles.secondaryBtn}
                                >
                                    Add
                                </button>
                            </div>

                            <div style={styles.pills}>
                                {tags.map((t) => (
                                    <button key={t} type="button" onClick={() => removeTag(t)} style={styles.pillBtn}>
                                        #{t} <span style={{ opacity: 0.85 }}>✕</span>
                                    </button>
                                ))}
                            </div>

                            {(fieldErrors.tags || tagsErr) && (
                                <div style={styles.fieldError}>{fieldErrors.tags || tagsErr}</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={styles.actions}>
                            <button type="submit" disabled={submitting || !isValid} style={styles.primaryBtn}>
                                {submitting ? "Saving…" : "Save"}
                            </button>

                            <button
                                type="button"
                                onClick={() => nav(`/insights/${initial.id}`)}
                                disabled={submitting}
                                style={styles.ghostBtn}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
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

    alert: {
        borderRadius: 14,
        padding: "12px 12px",
        border: "1px solid rgba(244,63,94,0.35)",
        background: "rgba(244,63,94,0.10)",
        color: "rgba(255,255,255,0.92)",
        marginBottom: 12,
    },

    loading: {
        padding: 14,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        opacity: 0.9,
    },

    form: { display: "grid", gap: 12 },
    field: { display: "grid", gap: 6 },
    label: { fontSize: 13, fontWeight: 800, opacity: 0.9 },
    hint: { fontSize: 12, opacity: 0.65 },

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

    textarea: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(10,16,32,0.45)",
        color: "rgba(255,255,255,0.92)",
        outline: "none",
        minHeight: 170,
        resize: "vertical",
        boxSizing: "border-box",
    },

    inputError: {
        border: "1px solid rgba(244,63,94,0.55)",
        background: "rgba(244,63,94,0.08)",
    },

    fieldError: { fontSize: 12, color: "rgba(255,255,255,0.92)" },

    tagRow: { display: "flex", gap: 10, alignItems: "center" },
    pills: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 },

    pillBtn: {
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 800,
    },

    actions: { display: "flex", gap: 10, marginTop: 4 },

    primaryBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "linear-gradient(90deg, rgba(99,102,241,0.95), rgba(16,185,129,0.85))",
        color: "white",
        fontWeight: 900,
        cursor: "pointer",
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

    ghostBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "transparent",
        color: "rgba(255,255,255,0.88)",
        fontWeight: 900,
        cursor: "pointer",
    },
};