"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BadgeCheck, MailCheck, MailX } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, Button, FormField, Input, Spinner } from "@/components/ui";
import { authApi } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { isApiError } from "@/types/api";

type VerifyState = "loading" | "success" | "error" | "missing-token";

function ResendForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await authApi.resendVerificationRequest(email);
      setSent(true);
    } catch (err) {
      setError(isApiError(err) ? err.message : "Could not resend the email. Please try again.");
    }
  });

  if (sent) {
    return (
      <Alert variant="success">
        Verification email sent. Check your inbox (and your spam folder) for the link.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormField label="Email" htmlFor="verify-resend-email" required error={errors.email?.message}>
        <Input
          id="verify-resend-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          invalid={Boolean(errors.email)}
          {...register("email")}
        />
      </FormField>
      <Button type="submit" fullWidth loading={isSubmitting}>
        Resend verification email
      </Button>
    </form>
  );
}

export function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>(() =>
    token ? "loading" : "missing-token",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    authApi
      .verifyEmailRequest(token)
      .then(() => {
        if (active) setState("success");
      })
      .catch((err) => {
        if (!active) return;
        setErrorMessage(isApiError(err) ? err.message : "We could not verify this link.");
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [token]);

  const HeadingIcons: Record<"success" | "error" | "missing-token", React.ReactNode> = {
    success: <BadgeCheck className="size-10 text-success-600" />,
    error: <MailX className="size-10 text-danger-600" />,
    "missing-token": <MailCheck className="size-10 text-info-600" />,
  };

  const headingIcon = (forState: "success" | "error" | "missing-token") => (
    <div className="flex justify-center">{HeadingIcons[forState]}</div>
  );

  return (
    <AuthShell
      title="Email verification"
      subtitle="Confirm your email address to activate your JobLink account."
      footer={
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          Go to log in
        </Link>
      }
    >
      <div className="space-y-5">
        {state === "loading" && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted/60 px-4 py-3">
            <Spinner className="size-5 text-primary-600" aria-hidden="true" />
            <span className="text-sm text-slate-600">Verifying your link…</span>
          </div>
        )}

        {state === "success" && (
          <>
            {headingIcon("success")}
            <Alert variant="success" title="Email verified">
              Your account is active. You can now log in and start using JobLink.
            </Alert>
            <Link href="/login" className="block">
              <Button fullWidth>Log in</Button>
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            {headingIcon("error")}
            <Alert variant="danger" title="This link did not work">
              {errorMessage ?? "The verification link may be invalid or already used."}
            </Alert>
            <div className="border-t border-border pt-5">
              <p className="mb-3 text-center text-sm text-slate-600">
                Enter your email and we&apos;ll send a fresh link.
              </p>
              <ResendForm />
            </div>
          </>
        )}

        {state === "missing-token" && (
          <>
            {headingIcon("missing-token")}
            <p className="text-sm text-slate-600">
              Open the link from your verification email to continue. Missed it? Request a new one
              below using the email you registered with.
            </p>
            <ResendForm />
          </>
        )}
      </div>
    </AuthShell>
  );
}