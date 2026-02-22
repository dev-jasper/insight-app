import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function navLinkStyle({ isActive }: { isActive: boolean }) {
    return {
        fontWeight: isActive ? 700 : 600,
        textDecoration: isActive ? "underline" : "none",
    } as React.CSSProperties;
}

export default function TopNav() {
    const { isAuthenticated, logout } = useAuth();
    const nav = useNavigate();

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "14px 24px",
                borderBottom: "1px solid #eee",
                fontFamily: "system-ui",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Link to="/insights" style={{ fontWeight: 800, textDecoration: "none" }}>
                    Insight App
                </Link>

                <nav style={{ display: "flex", gap: 12 }}>
                    <NavLink to="/insights" style={navLinkStyle}>
                        Insights
                    </NavLink>
                    <NavLink to="/analytics" style={navLinkStyle}>
                        Analytics
                    </NavLink>
                </nav>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {isAuthenticated ? (
                    <button
                        type="button"
                        onClick={() => {
                            logout();
                            nav("/login", { replace: true });
                        }}
                    >
                        Logout
                    </button>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </div>
        </header>
    );
}