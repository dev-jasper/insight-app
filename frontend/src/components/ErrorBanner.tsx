export function ErrorBanner({ message }: { message: string }) {
    if (!message) return null;
    return (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800">
            {message}
        </div>
    );
}