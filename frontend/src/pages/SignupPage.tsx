import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupApi } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { parseApiError } from "../api/errors";

type FieldErrors = Partial<Record<"username" | "email" | "password" | "confirmPassword", string>>;

export default function SignupPage() {
    const nav = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const canSubmit = useMemo(() => {
        return (
            username.trim().length > 0 &&
            password.length > 0 &&
            confirmPassword.length > 0 &&
            !submitting
        );
    }, [username, password, confirmPassword, submitting]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError("");
        setFieldErrors({});

        const next: FieldErrors = {};
        if (!username.trim()) next.username = "Username is required.";
        if (email && !email.includes("@")) next.email = "Please enter a valid email.";
        if (!password) next.password = "Password is required.";
        if (password.length > 0 && password.length < 8) next.password = "Password must be at least 8 characters.";
        if (!confirmPassword) next.confirmPassword = "Confirm password is required.";
        if (password && confirmPassword && password !== confirmPassword)
            next.confirmPassword = "Passwords do not match.";

        if (Object.keys(next).length) {
            setFieldErrors(next);
            return;
        }

        setSubmitting(true);
        try {
            const res = await signupApi({
                username: username.trim(),
                email: email.trim() || undefined,
                password,
            });

            // backend returns { user, tokens }
            await login(res.tokens, res.user.username);
            nav("/insights", { replace: true });
        } catch (err) {
            const parsed = parseApiError(err);
            setFormError(parsed.message || "Signup failed. Please try again.");

            // Optional mapping if backend returns field errors
            const fe: FieldErrors = {};
            const be = parsed.fieldErrors;
            if (be?.username?.[0]) fe.username = be.username[0];
            if (be?.email?.[0]) fe.email = be.email[0];
            if (be?.password?.[0]) fe.password = be.password[0];
            setFieldErrors(fe);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.bgGlow} />

            <div style={styles.card}>
                <div style={styles.headerRow}>
                    <div>
                        <div style={styles.kicker}>Insight App</div>
                        <h1 style={styles.title}>Create your account</h1>
                        <p style={styles.subtitle}>Sign up to create and manage insights.</p>
                    </div>
                </div>

                {formError && (
                    <div style={styles.alert}>
                        <div style={styles.alertTitle}>Signup failed</div>
                        <div style={styles.alertBody}>{formError}</div>
                    </div>
                )}

                <form onSubmit={onSubmit} style={styles.form}>
                    <div style={styles.field}>
                        <label style={styles.label}>Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. Jasper"
                            autoComplete="username"
                            style={{ ...styles.input, ...(fieldErrors.username ? styles.inputError : null) }}
                        />
                        {fieldErrors.username && <div style={styles.fieldError}>{fieldErrors.username}</div>}
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Email (optional)</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. jasper@email.com"
                            autoComplete="email"
                            style={{ ...styles.input, ...(fieldErrors.email ? styles.inputError : null) }}
                        />
                        {fieldErrors.email && <div style={styles.fieldError}>{fieldErrors.email}</div>}
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <div style={styles.passwordContainer}>
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                type={showPw ? "text" : "password"}
                                autoComplete="new-password"
                                style={{ ...styles.passwordInput, ...(fieldErrors.password ? styles.inputError : null) }}
                            />
                            <button type="button" onClick={() => setShowPw((s) => !s)} style={styles.showBtn}>
                                {showPw ? "Hide" : "Show"}
                            </button>
                        </div>
                        {fieldErrors.password && <div style={styles.fieldError}>{fieldErrors.password}</div>}
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            type={showPw ? "text" : "password"}
                            autoComplete="new-password"
                            style={{ ...styles.input, ...(fieldErrors.confirmPassword ? styles.inputError : null) }}
                        />
                        {fieldErrors.confirmPassword && (
                            <div style={styles.fieldError}>{fieldErrors.confirmPassword}</div>
                        )}
                    </div>

                    <button type="submit" disabled={!canSubmit} style={styles.primaryBtn}>
                        {submitting ? "Creating account…" : "Sign up"}
                    </button>

                    <div style={styles.miniLinks}>
                        <Link to="/login" style={styles.linkMuted}>
                            Already have an account? Sign in
                        </Link>

                        <Link to="/insights" style={styles.linkMuted}>
                            View insights (read-only)
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

// copied from LoginPage theme (same styles)
const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,.14), transparent 55%), #0b1020",
        color: "#0f172a",
        position: "relative",
        overflow: "hidden",
    },
    bgGlow: {
        position: "absolute",
        inset: -200,
        background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,255,.10), transparent 40%), radial-gradient(circle at 75% 20%, rgba(255,255,255,.06), transparent 35%)",
        filter: "blur(6px)",
        pointerEvents: "none",
    },
    card: {
        width: "100%",
        maxWidth: 440,
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: 16,
        padding: 22,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.6) inset",
        backdropFilter: "blur(10px)",
        position: "relative",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    kicker: {
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "rgba(15, 23, 42, 0.6)",
    },
    title: {
        margin: "6px 0 4px",
        fontSize: 28,
        lineHeight: 1.1,
        color: "#0f172a",
    },
    subtitle: {
        margin: 0,
        fontSize: 14,
        color: "rgba(15, 23, 42, 0.7)",
    },
    alert: {
        marginTop: 14,
        borderRadius: 12,
        padding: "10px 12px",
        border: "1px solid rgba(244,63,94,0.35)",
        background: "rgba(244,63,94,0.08)",
        color: "#9f1239",
    },
    alertTitle: {
        fontWeight: 800,
        fontSize: 13,
        marginBottom: 2,
    },
    alertBody: {
        fontSize: 13,
        opacity: 0.95,
    },
    form: {
        marginTop: 16,
        display: "grid",
        gap: 12,
    },
    field: {
        display: "grid",
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: 700,
        color: "rgba(15, 23, 42, 0.85)",
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(15, 23, 42, 0.18)",
        outline: "none",
        background: "rgba(255,255,255,0.9)",
        fontSize: 14,
        boxSizing: "border-box",
    },
    inputError: {
        border: "1px solid rgba(244,63,94,0.55)",
        background: "rgba(244,63,94,0.05)",
    },
    fieldError: {
        fontSize: 12,
        color: "#be123c",
    },
    showBtn: {
        position: "absolute",
        right: 8,
        top: "50%",
        transform: "translateY(-50%)",
        height: 28,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        border: "1px solid rgba(15, 23, 42, 0.14)",
        background: "rgba(15,23,42,0.04)",
        padding: "0 10px",
        fontSize: 12,
        cursor: "pointer",
    },
    primaryBtn: {
        marginTop: 4,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(15, 23, 42, 0.18)",
        background: "#0f172a",
        color: "white",
        fontWeight: 800,
        cursor: "pointer",
        opacity: 1,
    },
    miniLinks: {
        marginTop: 8,
        display: "flex",
        justifyContent: "space-between",
    },
    linkMuted: {
        fontSize: 12,
        color: "rgba(15, 23, 42, 0.65)",
        textDecoration: "underline",
    },
    passwordContainer: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    passwordInput: {
        width: "100%",
        padding: "10px 12px",
        paddingRight: 70,
        borderRadius: 12,
        border: "1px solid rgba(15, 23, 42, 0.18)",
        outline: "none",
        background: "rgba(255,255,255,0.9)",
        fontSize: 14,
        boxSizing: "border-box",
    },
};