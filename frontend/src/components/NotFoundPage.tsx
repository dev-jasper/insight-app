import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <main className="mx-auto max-w-xl p-6">
            <h1 className="text-2xl font-semibold">404</h1>
            <p className="mt-2 text-gray-700">That page doesn’t exist.</p>
            <Link className="mt-4 inline-block rounded-lg border px-3 py-2" to="/insights">
                Go to Insights
            </Link>
        </main>
    );
}