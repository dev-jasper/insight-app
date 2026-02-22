import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import { createInsight } from "../api/insights";
import type { ApiError } from "../api/types";

const CATEGORY_OPTIONS = ["Macro", "Equities", "FixedIncome", "Alternatives"];

const TITLE_MIN = 5;
const TITLE_MAX = 200;
const BODY_MIN = 20;
const TAG_MIN = 1;
const TAG_MAX = 10;

type FieldErrors = Partial<Record<"title" | "category" | "body" | "tags", string>>;

function getApiErrorMessage(err: unknown): { form: string; fields: FieldErrors } {
    const e = err as { response?: { data?: ApiError } };
    const data = e.response?.data;

    if (!data) return { form: "Network error. Please try again.", fields: {} };

    const fields: FieldErrors = {};
    if (data.errors) {
        if (data.errors.title?.[0]) fields.title = data.errors.title[0];
        if (data.errors.category?.[0]) fields.category = data.errors.category[0];
        if (data.errors.body?.[0]) fields.body = data.errors.body[0];
        if (data.errors.tags?.[0]) fields.tags = data.errors.tags[0];
    }

    return {
        form: data.detail || "Request failed. Please try again.",
        fields,
    };
}

function normalizeTag(raw: string) {
    return raw.trim().replace(/^#/, "");
}

export default function InsightCreatePage() {
    const nav = useNavigate();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState(CATEGORY_OPTIONS[0] ?? "");
    const [body, setBody] = useState("");

    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    // --- Live validation //---
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

    const categoryErr = useMemo(() => {
        if (!category) return "Category is required.";
        return "";
    }, [category]);

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
            const created = await createInsight({
                title: title.trim(),
                category,
                body: body.trim(),
                tags,
            });
            nav(`/insights/${created.id}`, { replace: true });
        } catch (err) {
            const api = getApiErrorMessage(err);
            setFormError(api.form);
            setFieldErrors(api.fields);
        } finally {
            setSubmitting(false);
        }
    }

    const showTitleErr = fieldErrors.title || titleErr;
    const showCatErr = fieldErrors.category || categoryErr;
    const showBodyErr = fieldErrors.body || bodyErr;
    const showTagsErr = fieldErrors.tags || tagsErr;

    return (
        <>
            <TopNav />

            <div style={styles.page}>
                <main style={styles.main}>
                    <div style={styles.headerRow}>
                        <div>
                            <div style={styles.kicker}>INSIGHTS</div>
                            <h1 style={styles.h1}>Create Insight</h1>
                            <div style={styles.sub}>Write a new insight and tag it for analytics.</div>
                        </div>

                        <Link to="/insights" style={styles.backLink}>
                            ← Back
                        </Link>
                    </div>

                    <div style={styles.card}>
                        {formError && (
                            <div style={styles.alert}>
                                <div style={styles.alertTitle}>Could not create</div>
                                <div style={styles.alertBody}>{formError}</div>
                            </div>
                        )}

                        <form onSubmit={onSubmit} style={styles.form}>
                            {/* Title */}
                            <div style={styles.field}>
                                <div style={styles.labelRow}>
                                    <label style={styles.label}>Title</label>
                                    <span style={styles.counter}>
                                        {title.trim().length}/{TITLE_MAX}
                                    </span>
                                </div>

                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="5–200 characters"
                                    style={{
                                        ...styles.input,
                                        ...(showTitleErr ? styles.inputError : null),
                                    }}
                                />
                                {showTitleErr && <div style={styles.fieldError}>{showTitleErr}</div>}
                            </div>

                            {/* Category */}
                            <div style={styles.field}>
                                <label style={styles.label}>Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    style={{
                                        ...styles.input,
                                        ...(showCatErr ? styles.inputError : null),
                                    }}
                                >
                                    {CATEGORY_OPTIONS.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                {showCatErr && <div style={styles.fieldError}>{showCatErr}</div>}
                            </div>

                            {/* Body */}
                            <div style={styles.field}>
                                <label style={styles.label}>Body</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder={`Minimum ${BODY_MIN} characters`}
                                    style={{
                                        ...styles.textarea,
                                        ...(showBodyErr ? styles.inputError : null),
                                    }}
                                />
                                {showBodyErr && <div style={styles.fieldError}>{showBodyErr}</div>}
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
                                        style={{
                                            ...styles.secondaryBtn,
                                            opacity: !tagInput.trim() || tags.length >= TAG_MAX ? 0.55 : 1,
                                            cursor: !tagInput.trim() || tags.length >= TAG_MAX ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>

                                {tags.length > 0 && (
                                    <div style={styles.tagPills}>
                                        {tags.map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => removeTag(t)}
                                                style={styles.tagPill}
                                                title="Remove tag"
                                            >
                                                #{t} <span style={{ opacity: 0.85 }}>✕</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div style={styles.helperRow}>
                                    <span style={styles.helper}>
                                        {tags.length}/{TAG_MAX} tags
                                    </span>
                                </div>

                                {showTagsErr && <div style={styles.fieldError}>{showTagsErr}</div>}
                            </div>

                            {/* Actions */}
                            <div style={styles.actions}>
                                <button type="submit" disabled={submitting || !isValid} style={styles.primaryBtn}>
                                    {submitting ? "Creating…" : "Create"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => nav("/insights")}
                                    disabled={submitting}
                                    style={styles.secondaryBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </>
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
        maxWidth: 900,
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
    card: {
        marginTop: 14,
        borderRadius: 16,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
    },
    alert: {
        borderRadius: 14,
        padding: "10px 12px",
        border: "1px solid rgba(244,63,94,0.35)",
        background: "rgba(244,63,94,0.10)",
        color: "rgba(255,255,255,0.92)",
        marginBottom: 12,
    },
    alertTitle: { fontWeight: 900, fontSize: 13, marginBottom: 2 },
    alertBody: { fontSize: 13, opacity: 0.9 },

    form: { display: "grid", gap: 14 },
    field: { display: "grid", gap: 6 },

    labelRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
    label: { fontSize: 12, opacity: 0.85, fontWeight: 900, letterSpacing: 0.2 },
    counter: { fontSize: 12, opacity: 0.65 },

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
    textarea: {
        width: "100%",
        minHeight: 180,
        resize: "vertical",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(15,23,42,0.35)",
        color: "rgba(255,255,255,0.92)",
        outline: "none",
        fontSize: 14,
        boxSizing: "border-box",
        lineHeight: 1.5,
    },
    inputError: {
        border: "1px solid rgba(244,63,94,0.55)",
        background: "rgba(244,63,94,0.08)",
    },
    fieldError: {
        fontSize: 12,
        color: "rgba(255,180,190,0.95)",
        fontWeight: 700,
    },

    tagRow: { display: "flex", gap: 10, alignItems: "center" },
    tagPills: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 },
    tagPill: {
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.9)",
        fontWeight: 800,
        fontSize: 12,
        cursor: "pointer",
    },
    helperRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    helper: { fontSize: 12, opacity: 0.7 },

    actions: { display: "flex", gap: 10, marginTop: 4 },
    primaryBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(15, 23, 42, 0.95)",
        color: "white",
        fontWeight: 900,
        cursor: "pointer",
    },
    secondaryBtn: {
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.9)",
        fontWeight: 900,
        cursor: "pointer",
    },
};