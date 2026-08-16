"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { RedirectIfAuthenticated } from "@/components/auth/guards";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { homePathForRole } from "@/config/site";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { isApiError } from "@/types/api";

export function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const user = await login(values);
      if (next && next.startsWith("/") && !next.startsWith("//")) {
        router.replace(next);
      } else {
        router.replace(homePathForRole(user.role));
      }
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Unable to log in. Please try again.");
    }
  });

  return (
    <RedirectIfAuthenticated>
      <AuthShell
        title="Welcome back"
        subtitle="Log in to continue to your dashboard."
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary-700 hover:underline">
              Create one
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <FormField label="Email" htmlFor="login-email" required error={errors.email?.message}>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="login-password"
            required
            error={errors.password?.message}
            hint={
              <Link href="/forgot-password" className="font-medium text-primary-700 hover:underline">
                Forgot password?
              </Link>
            }
          >
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </FormField>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Log in
          </Button>
        </form>
      </AuthShell>
    </RedirectIfAuthenticated>
  );
}