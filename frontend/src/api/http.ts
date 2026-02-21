import axios from "axios";
import { tokenStorage } from "../auth/tokenStorage";

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export const http = axios.create({
    baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            // simplest exam-safe behavior: drop tokens and force re-login
            tokenStorage.clear();
            // optional: you can redirect if you want:
            // window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);