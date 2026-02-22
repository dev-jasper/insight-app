import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import "./index.css";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import AppRouter from "./app/AppRouter";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AppErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </AuthProvider>
        </AppErrorBoundary>
    </React.StrictMode>
);