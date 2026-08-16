"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { authApi } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { isApiError } from "@/types/api";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await authApi.forgotPasswordRequest(email);
      setSent(true);
    } catch (err) {
      setFormError(isApiError(err) ? err.message : "Could not send the reset link. Please try again.");
    }
  });

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you registered with and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5">
          <div className="flex justify-center">
            <MailCheck className="size-10 text-success-600" />
          </div>
          <Alert variant="success" title="Reset link sent">
            If an account exists for that email, you&apos;ll receive a link to choose a new password.
            Check your inbox, or view the {" "}
            <Link href="/reset-password" className="font-medium underline">
              reset page
            </Link>{" "}
            if you already have the link open.
          </Alert>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <FormField label="Email" htmlFor="forgot-email" required error={errors.email?.message}>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </FormField>
          <Button type="submit" fullWidth loading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}