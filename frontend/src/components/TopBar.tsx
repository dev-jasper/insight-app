import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function TopBar() {
    const { isAuthed, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #ddd" }}>
            <strong style={{ marginRight: "auto" }}>Insight App</strong>

            {isAuthed ? (
                <button
                    onClick={() => {
                        logout();
                        navigate("/login", { replace: true });
                    }}
                >
                    Logout
                </button>
            ) : (
                <button onClick={() => navigate("/login")}>Login</button>
            )}
        </div>
    );
}