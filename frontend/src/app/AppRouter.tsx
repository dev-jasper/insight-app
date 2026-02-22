import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import InsightsListPage from "../pages/InsightsListPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import InsightDetailPage from "../pages/InsightDetailPage";
import InsightEditPage from "../pages/InsightEditPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "../auth/ProtectedRoute";
import InsightCreatePage from "../pages/InsightCreatePage";


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
                        <InsightCreatePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/insights/:id/"
                element={
                    <ProtectedRoute>
                        <InsightDetailPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/insights/:id/edit"
                element={
                    <ProtectedRoute>
                        <InsightEditPage />
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