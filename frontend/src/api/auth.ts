import { http } from "./http";
import { LoginResponse } from "../types/api";

export async function login(email: string, password: string) {
    const response = await http.post<LoginResponse>("/auth/login", {
        email,
        password,
    });

    return response.data;
}