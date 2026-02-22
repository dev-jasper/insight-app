import { http } from "./http";
import type { LoginResponse } from "./types";

export type LoginPayload = { username: string; password: string };

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
    const res = await http.post<LoginResponse>("/api/auth/login/", payload);
    return res.data;
}

export type SignupPayload = {
    username: string;
    email?: string;
    password: string;
};

export type SignupResponse = {
    user: { id: number; username: string; email?: string };
    tokens: { access: string; refresh: string };
};

export async function signupApi(payload: SignupPayload): Promise<SignupResponse> {
    const res = await http.post<SignupResponse>("/api/auth/signup/", payload);
    return res.data;
}

export type MeResponse = { id: number; username: string };

export async function meApi(): Promise<MeResponse> {
    const res = await http.get<MeResponse>("/api/auth/me/");
    return res.data;
}

export async function logoutApi(): Promise<void> {
    await http.post("/api/auth/logout/");
}