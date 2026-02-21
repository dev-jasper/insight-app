import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import InsightsListPage from "../pages/InsightsListPage";
import InsightFormPage from "../pages/InsightFormPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "../auth/ProtectedRoute";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Navigate to="/insights" replace />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/insights"
                element={
                    <ProtectedRoute>
                        <InsightsListPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/insights/new"
                element={
                    <ProtectedRoute>
                        <InsightFormPage mode="create" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/insights/:id/edit"
                element={
                    <ProtectedRoute>
                        <InsightFormPage mode="edit" />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <AnalyticsPage />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}