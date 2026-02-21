import { http } from "./http";
import type { LoginResponse } from "./types";

export type LoginPayload = { username: string; password: string };

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
    const res = await http.post<LoginResponse>("/api/auth/login", payload);
    return res.data;
}