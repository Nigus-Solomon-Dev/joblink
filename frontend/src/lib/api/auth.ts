import type { AuthResponse, User, UserRole } from "@/types";

import { http, unwrap } from "./http";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await http.post("/auth/login", payload));
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  return unwrap<AuthResponse>(await http.post("/auth/register", payload));
}

export async function logoutRequest(): Promise<null> {
  return unwrap<null>(await http.post("/auth/logout", {}));
}

export async function logoutAllRequest(): Promise<null> {
  return unwrap<null>(await http.post("/auth/logout-all"));
}

export async function getMeRequest(): Promise<{ user: User }> {
  return unwrap<{ user: User }>(await http.get("/auth/me"));
}

export async function updateProfileRequest(
  data: Partial<Pick<User, "name" | "phone" | "bio" | "location" | "website" | "linkedin">>,
): Promise<{ user: User }> {
  return unwrap<{ user: User }>(await http.patch("/auth/profile", data));
}

export async function changePasswordRequest(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<null> {
  return unwrap<null>(await http.post("/auth/change-password", payload));
}

export async function resendVerificationRequest(email: string): Promise<null> {
  return unwrap<null>(await http.post("/auth/resend-verification", { email }));
}

export async function verifyEmailRequest(token: string): Promise<null> {
  return unwrap<null>(await http.get(`/auth/verify-email/${encodeURIComponent(token)}`));
}

export async function forgotPasswordRequest(email: string): Promise<null> {
  return unwrap<null>(await http.post("/auth/forgot-password", { email }));
}

export async function resetPasswordRequest(
  token: string,
  payload: { password: string; confirmPassword: string },
): Promise<null> {
  return unwrap<null>(await http.post(`/auth/reset-password/${token}`, payload));
}

export async function updateAvatarRequest(file: File): Promise<{ user: User }> {
  const formData = new FormData();
  formData.append("avatar", file);
  return unwrap<{ user: User }>(
    await http.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  );
}
