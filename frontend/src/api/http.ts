import axios from "axios";
import { tokenStorage } from "../auth/tokenStorage";

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
    headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

http.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.response?.status === 401) {
            tokenStorage.clear();
            window.dispatchEvent(new Event("auth:logout"));
            // window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);