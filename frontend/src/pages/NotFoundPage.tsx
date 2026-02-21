import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold">404</h1>
            <Link to="/insights" className="text-blue-600 underline">
                Go back
            </Link>
        </div>
    );
}