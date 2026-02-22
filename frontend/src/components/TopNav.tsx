import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function linkStyle(isActive: boolean): React.CSSProperties {
    return {
        padding: "8px 12px",
        borderRadius: 999,
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 13,
        color: isActive ? "white" : "rgba(255,255,255,0.78)",
        background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
        border: isActive ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
    };
}

export default function TopNav() {
    const nav = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();

    return (
        <div style={styles.shell}>
            <div style={styles.bar}>
                {/* Left */}
                <div style={styles.left}>
                    <span style={styles.brand}>INSIGHT APP</span>
                </div>

                {/* Middle */}
                <div style={styles.mid}>
                    <NavLink to="/insights" style={({ isActive }) => linkStyle(isActive)}>
                        Insights
                    </NavLink>
                    <NavLink to="/analytics" style={({ isActive }) => linkStyle(isActive)}>
                        Analytics
                    </NavLink>
                </div>

                {/* Right */}
                <div style={styles.right}>
                    {isAuthenticated ? (
                        <>
                            <div style={styles.userPill} title={user?.username ?? ""}>
                                <span style={styles.dot} />
                                <span style={{ fontWeight: 700, fontSize: 13, color: "white" }}>
                                    {user?.username ?? "User"}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    logout();
                                    nav("/login", { replace: true });
                                }}
                                style={styles.logoutBtn}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={() => nav("/login")} style={styles.logoutBtn}>
                            Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shell: {
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "14px 14px 10px",
        background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,.14), transparent 55%), #0b1020",
    },
    bar: {
        maxWidth: 980,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.30)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
    },
    left: { display: "flex", alignItems: "center", gap: 10 },
    brand: {
        color: "rgba(255,255,255,0.88)",
        letterSpacing: 0.8,
        fontWeight: 900,
        fontSize: 12,
    },
    mid: {
        display: "flex",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
        padding: 4,
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
    },
    right: { display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 },
    userPill: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "rgba(99,102,241,0.9)",
        boxShadow: "0 0 0 4px rgba(99,102,241,0.16)",
    },
    logoutBtn: {
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.9)",
        fontWeight: 800,
        cursor: "pointer",
    },
};