import React from "react";
import TopNav from "./TopNav";

type Props = {
    title?: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: number;
};

export default function PageShell({
    title,
    subtitle,
    right,
    children,
    maxWidth = 980,
}: Props) {
    return (
        <div style={styles.page}>
            <TopNav />

            <main style={{ ...styles.main, maxWidth }}>
                {(title || right) && (
                    <header style={styles.header}>
                        <div>
                            {title && <div style={styles.kicker}>{title.toUpperCase()}</div>}
                            {title && <h1 style={styles.h1}>{title}</h1>}
                            {subtitle && <div style={styles.sub}>{subtitle}</div>}
                        </div>
                        {right && <div style={styles.right}>{right}</div>}
                    </header>
                )}

                {children}
            </main>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(16,185,129,.14), transparent 55%), #0b1020",
        color: "rgba(255,255,255,0.92)",
    },
    main: {
        margin: "0 auto",
        padding: "18px 14px 40px",
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 14,
        marginTop: 10,
        marginBottom: 14,
    },
    kicker: {
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 0.8,
        opacity: 0.75,
    },
    h1: {
        margin: "6px 0 4px",
        fontSize: 36,
        lineHeight: 1.05,
        letterSpacing: -0.4,
        color: "rgba(255,255,255,0.94)",
    },
    sub: {
        fontSize: 13,
        opacity: 0.75,
        marginTop: 2,
    },
    right: {
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "flex-end",
    },
};