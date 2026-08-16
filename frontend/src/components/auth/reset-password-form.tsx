"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { authApi } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { isApiError } from "@/types/api";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) return;
    setFormError(null);
    try {
      await authApi.resetPasswordRequest(token, values);
      setDone(true);
    } catch (err) {
      setFormError(isApiError(err) ? err.message : "Could not reset your password. Please try again.");
    }
  });

  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This password-reset link is missing or incomplete."
        footer={
          <Link href="/forgot-password" className="font-medium text-primary-700 hover:underline">
            Request a new reset link
          </Link>
        }
      >
        <Alert variant="danger">
          Open the link exactly as it appears in the email you received. If it still fails, request a
          fresh link.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick something strong — you'll use it to log in next time."
      footer={
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          Back to log in
        </Link>
      }
    >
      {done ? (
        <div className="space-y-5">
          <div className="flex justify-center">
            <ShieldCheck className="size-10 text-success-600" />
          </div>
          <Alert variant="success" title="Password updated">
            Your password was reset successfully. You can now log in with your new password.
          </Alert>
          <Link href="/login" className="block">
            <Button fullWidth>Log in</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <FormField
            label="New password"
            htmlFor="reset-password"
            required
            error={errors.password?.message}
            hint="At least 8 characters with upper & lower case, a number, and a special character."
          >
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </FormField>

          <FormField
            label="Confirm password"
            htmlFor="reset-confirm"
            required
            error={errors.confirmPassword?.message}
          >
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
          </FormField>

          <Button type="submit" fullWidth loading={isSubmitting}>
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}