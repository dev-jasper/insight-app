import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginApi } from "../api/auth";
import type { ApiError } from "../api/types";
import { useAuth } from "../auth/AuthContext";

function isValidEmail(email: string) {
    // simple and good enough for exam
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const redirectTo = useMemo(() => {
        const state = location.state as { from?: string } | null;
        return state?.from ?? "/insights";
    }, [location.state]);

    const [emailOrUsername, setEmailOrUsername] = useState("");
    const [password, setPassword] = useState("");

    const [fieldErrors, setFieldErrors] = useState<{
        emailOrUsername?: string;
        password?: string;
    }>({});

    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function validate() {
        const errs: typeof fieldErrors = {};

        if (!emailOrUsername.trim()) {
            errs.emailOrUsername = "This field is required.";
        } else {
            // If you know it's email-based login, keep this.
            // If it's username-based, remove this email check.
            const looksLikeEmail = emailOrUsername.includes("@");
            if (looksLikeEmail && !isValidEmail(emailOrUsername)) {
                errs.emailOrUsername = "Please enter a valid email address.";
            }
        }

        if (!password) {
            errs.password = "Password is required.";
        } else if (password.length < 6) {
            errs.password = "Password must be at least 6 characters.";
        }

        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setFormError(null);

        if (!validate()) return;

        setSubmitting(true);
        try {
            // Choose ONE payload shape based on your backend:
            // A) email login:
            const payload = { username: emailOrUsername.trim(), password };

            // B) username login (if needed):
            // const payload = { username: emailOrUsername.trim(), password };

            const tokens = await loginApi(payload);
            login(tokens);

            navigate(redirectTo, { replace: true });
        } catch (err: any) {
            const data: ApiError | undefined = err?.response?.data;

            // Try to display standardized backend errors if present
            if (data?.errors) {
                const next: typeof fieldErrors = {};
                if (data.errors.email?.[0]) next.emailOrUsername = data.errors.email[0];
                if (data.errors.username?.[0]) next.emailOrUsername = data.errors.username[0];
                if (data.errors.password?.[0]) next.password = data.errors.password[0];
                setFieldErrors((prev) => ({ ...prev, ...next }));
            }

            setFormError(
                data?.message ||
                "Login failed. Please check your credentials and try again."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md rounded-2xl bg-white shadow p-6">
                <h1 className="text-2xl font-semibold">Login</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Sign in to manage insights.
                </p>

                {formError ? (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {formError}
                    </div>
                ) : null}

                <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email / Username
                        </label>
                        <input
                            className={`mt-1 w-full rounded-lg border p-2 outline-none focus:ring-2 ${fieldErrors.emailOrUsername
                                ? "border-red-300 focus:ring-red-200"
                                : "border-gray-300 focus:ring-gray-200"
                                }`}
                            value={emailOrUsername}
                            onChange={(e) => setEmailOrUsername(e.target.value)}
                            autoComplete="username"
                            placeholder="you@example.com"
                        />
                        {fieldErrors.emailOrUsername ? (
                            <p className="mt-1 text-xs text-red-600">
                                {fieldErrors.emailOrUsername}
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            className={`mt-1 w-full rounded-lg border p-2 outline-none focus:ring-2 ${fieldErrors.password
                                ? "border-red-300 focus:ring-red-200"
                                : "border-gray-300 focus:ring-gray-200"
                                }`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="••••••••"
                        />
                        {fieldErrors.password ? (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                        ) : null}
                    </div>

                    <button
                        disabled={submitting}
                        className="w-full rounded-lg bg-black text-white py-2 font-medium disabled:opacity-60"
                    >
                        {submitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="mt-4 text-xs text-gray-500">
                    Tip: after login, you’ll be redirected to{" "}
                    <span className="font-mono">{redirectTo}</span>
                </div>
            </div>
        </div>
    );
}