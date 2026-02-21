import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createInsight } from "../api/insights";
import type { ApiError } from "../api/types";
import { Link } from "react-router-dom";

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

    // --- Live validation (frontend) ---
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

        // prevent duplicates (case-insensitive)
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

        // client-side validation gate
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

    return (
        <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
            <h1>Create Insight</h1>

            {formError && (
                <div style={{ background: "#fee", border: "1px solid #f99", padding: 12, marginTop: 12 }}>
                    {formError}
                </div>
            )}

            <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 14 }}>
                {/* Title */}
                <div>
                    <label style={{ display: "block", fontWeight: 600 }}>Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="5–200 characters"
                        style={{ width: "100%", padding: 10 }}
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {title.trim().length}/{TITLE_MAX}
                    </div>
                    {(fieldErrors.title || titleErr) && (
                        <div style={{ color: "crimson", marginTop: 4 }}>
                            {fieldErrors.title || titleErr}
                        </div>
                    )}
                </div>

                {/* Category */}
                <div>
                    <label style={{ display: "block", fontWeight: 600 }}>Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ width: "100%", padding: 10 }}
                    >
                        {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    {(fieldErrors.category || categoryErr) && (
                        <div style={{ color: "crimson", marginTop: 4 }}>
                            {fieldErrors.category || categoryErr}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div>
                    <label style={{ display: "block", fontWeight: 600 }}>Body</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={`Minimum ${BODY_MIN} characters`}
                        style={{ width: "100%", padding: 10, minHeight: 160 }}
                    />
                    {(fieldErrors.body || bodyErr) && (
                        <div style={{ color: "crimson", marginTop: 4 }}>
                            {fieldErrors.body || bodyErr}
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div>
                    <label style={{ display: "block", fontWeight: 600 }}>Tags</label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Type a tag then press Add (or Enter)"
                            style={{ flex: 1, padding: 10 }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTag();
                                }
                            }}
                        />
                        <button type="button" onClick={addTag} disabled={!tagInput.trim() || tags.length >= TAG_MAX}>
                            Add
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                        {tags.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => removeTag(t)}
                                style={{ padding: "4px 8px", border: "1px solid #ccc" }}
                                title="Remove tag"
                            >
                                #{t} ✕
                            </button>
                        ))}
                    </div>

                    {(fieldErrors.tags || tagsErr) && (
                        <div style={{ color: "crimson", marginTop: 4 }}>
                            {fieldErrors.tags || tagsErr}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" disabled={submitting || !isValid}>
                        {submitting ? "Creating…" : "Create"}
                    </button>
                    <button type="button" onClick={() => nav("/insights")} disabled={submitting}>
                        Cancel
                    </button>
                </div>
            </form>
        </main>
    );
}