import React, { useMemo, useState } from "react";
import { createInsight, toApiError } from "../api/insights";
import type { ApiError } from "../api/types";
import { useNavigate } from "react-router-dom";

const CATEGORY_OPTIONS = ["Macro", "Micro"]; // TODO: replace with real enum
const TITLE_MIN = 5;
const TITLE_MAX = 200;
const BODY_MIN = 20;
const TAG_MIN = 1;
const TAG_MAX = 10;

type FieldErrors = Partial<Record<"title" | "category" | "body" | "tags", string>>;

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
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const titleErr = useMemo(() => {
        const t = title.trim();
        if (!t) return "Title is required.";
        if (t.length < TITLE_MIN) return `Title must be at least ${TITLE_MIN} characters.`;
        if (t.length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters.`;
        return "";
    }, [title]);

    const bodyErr = useMemo(() => {
        const b = body.trim();
        if (!b) return "Body is required.";
        if (b.length < BODY_MIN) return `Body must be at least ${BODY_MIN} characters.`;
        return "";
    }, [body]);

    const categoryErr = useMemo(() => {
        if (!category) return "Category is required.";
        return "";
    }, [category]);

    const tagsErr = useMemo(() => {
        if (tags.length < TAG_MIN) return `At least ${TAG_MIN} tag is required.`;
        if (tags.length > TAG_MAX) return `At most ${TAG_MAX} tags allowed.`;
        const uniq = new Set(tags.map((t) => t.toLowerCase()));
        if (uniq.size !== tags.length) return "Tags must not contain duplicates.";
        return "";
    }, [tags]);

    const isValid = !titleErr && !bodyErr && !categoryErr && !tagsErr;

    function addTagFromInput() {
        const v = normalizeTag(tagInput);
        if (!v) return;

        // avoid duplicates (case-insensitive)
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

    function applyBackendErrors(apiErr?: ApiError) {
        const next: FieldErrors = {};

        const e = apiErr?.errors ?? {};
        if (e.title?.[0]) next.title = e.title[0];
        if (e.category?.[0]) next.category = e.category[0];
        if (e.body?.[0]) next.body = e.body[0];
        if (e.tags?.[0]) next.tags = e.tags[0];

        setFieldErrors(next);
        setFormError(apiErr?.message || "Create failed. Please try again.");
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setFieldErrors({});

        // client-side validation first
        const clientErrs: FieldErrors = {};
        if (titleErr) clientErrs.title = titleErr;
        if (categoryErr) clientErrs.category = categoryErr;
        if (bodyErr) clientErrs.body = bodyErr;
        if (tagsErr) clientErrs.tags = tagsErr;

        if (Object.keys(clientErrs).length > 0) {
            setFieldErrors(clientErrs);
            return;
        }

        setSubmitting(true);
        try {
            await createInsight({
                title: title.trim(),
                category,
                body: body.trim(),
                tags,
            });

            nav("/insights", { replace: true });
        } catch (err: any) {
            applyBackendErrors(toApiError(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-semibold">Create Insight</h1>
            <p className="text-sm text-gray-600 mt-1">
                Fill in the details below. Validation runs live + on submit.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
                {formError && (
                    <div className="p-3 rounded-lg border bg-red-50 text-red-700">
                        {formError}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="5–200 characters"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        {title.trim().length}/{TITLE_MAX}
                    </p>
                    {(fieldErrors.title || titleErr) && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.title || titleErr}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium">Category</label>
                    <select
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                    {(fieldErrors.category || categoryErr) && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.category || categoryErr}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium">Body</label>
                    <textarea
                        className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[140px]"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder={`Minimum ${BODY_MIN} characters`}
                    />
                    {(fieldErrors.body || bodyErr) && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.body || bodyErr}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium">Tags</label>
                    <div className="mt-1 flex gap-2">
                        <input
                            className="flex-1 border rounded-lg px-3 py-2"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Type a tag then press Add"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addTagFromInput();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg border"
                            onClick={addTagFromInput}
                            disabled={!tagInput.trim() || tags.length >= TAG_MAX}
                        >
                            Add
                        </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => removeTag(t)}
                                className="text-xs px-2 py-1 rounded-full bg-gray-200 hover:bg-gray-300"
                                title="Click to remove"
                            >
                                #{t} ✕
                            </button>
                        ))}
                    </div>

                    {(fieldErrors.tags || tagsErr) && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.tags || tagsErr}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={submitting || !isValid}
                        className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
                    >
                        {submitting ? "Creating…" : "Create"}
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg border"
                        onClick={() => nav("/insights")}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}