export function LoadingBlock({ text = "Loading…" }: { text?: string }) {
    return (
        <div className="rounded-xl border p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-1/3 rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
            <p className="mt-3 text-sm text-gray-600">{text}</p>
        </div>
    );
}