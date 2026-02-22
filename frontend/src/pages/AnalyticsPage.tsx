import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function AnalyticsPage() {
    const [tags, setTags] = useState<TopTag[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // simple total
    const totalMentions = useMemo(
        () => tags.reduce((sum, t) => sum + t.count, 0),
        [tags]
    );

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

    return (
        <main className="mx-auto max-w-3xl p-6 font-sans">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="mt-1 text-sm text-neutral-600">
                        Top tags across insights {tags.length > 0 ? `• ${totalMentions} total mentions` : ""}
                    </p>
                </div>

                <Link className="text-sm text-blue-700 hover:underline" to="/insights">
                    ← Back to Insights
                </Link>
            </div>

            <div className="mt-6 rounded-lg border bg-white p-4">
                {loading && <p className="text-sm text-neutral-700">Loading…</p>}

                {!loading && error && (
                    <p className="text-sm text-red-600">{error}</p>
                )}

                {!loading && !error && tags.length === 0 && (
                    <p className="text-sm text-neutral-700">No tag data yet.</p>
                )}

                {!loading && !error && tags.length > 0 && (
                    <ul className="divide-y">
                        {tags.map((t) => (
                            <li key={t.name} className="flex items-center justify-between py-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">#{t.name}</span>

                                        {/* click -> filter insights by tag */}
                                        <Link
                                            to={`/insights?tag=${encodeURIComponent(t.name)}`}
                                            className="text-xs text-blue-700 hover:underline"
                                            title="View insights with this tag"
                                        >
                                            View
                                        </Link>
                                    </div>

                                    <p className="mt-1 text-xs text-neutral-500">
                                        Used in {t.count} insight{t.count === 1 ? "" : "s"}
                                    </p>
                                </div>

                                {/* simple badge */}
                                <span className="rounded-full border px-3 py-1 text-sm">
                                    {t.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}