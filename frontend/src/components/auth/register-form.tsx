"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Building2, UserRound } from "lucide-react";

import { RedirectIfAuthenticated } from "@/components/auth/guards";
import { AuthShell } from "@/components/auth/auth-shell";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { authApi } from "@/lib/api";
import { isApiError } from "@/types/api";
import { cn } from "@/lib/cn";

type RegisterStep = "form" | "done";

export function CheckEmailNotice({ email }: { email: string }) {
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const resend = async () => {
    setResendState("sending");
    try {
      await authApi.resendVerificationRequest(email);
      setResendState("sent");
    } catch {
      setResendState("error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid size-12 place-items-center rounded-full bg-success-50 text-success-600">
        <BadgeCheck className="size-6" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h2>
        <p className="text-sm text-slate-600">
          We sent a verification link to <span className="font-semibold text-foreground">{email}</span>.
          Confirm your email, then log in.
        </p>
      </div>

      <Alert variant="info">Haven&apos;t received anything? Check spam, or resend the link below.</Alert>

      {resendState === "sent" && <Alert variant="success">Verification email sent. Check your inbox.</Alert>}
      {resendState === "error" && (
        <Alert variant="danger">We could not send the email right now. Try again shortly.</Alert>
      )}

      <Button
        variant="secondary"
        fullWidth
        loading={resendState === "sending"}
        onClick={() => void resend()}
      >
        Resend verification email
      </Button>
      <Link href="/login" className="block">
        <Button variant="outline" fullWidth>
          Back to log in
        </Button>
      </Link>
    </div>
  );
}

const roleOptions = [
  {
    value: "job_seeker",
    label: "Job seeker",
    description: "I'm looking for my next role.",
    icon: <UserRound className="size-5" />,
  },
  {
    value: "employer",
    label: "Employer",
    description: "I'm hiring and building a team.",
    icon: <Building2 className="size-5" />,
  },
] as const;

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<RegisterStep>("form");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      role: searchParams.get("role") === "employer" ? "employer" : "job_seeker",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = useWatch({ control, name: "role" });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await registerAccount(values);
      setSubmittedEmail(values.email);
      setStep("done");
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Could not create your account. Please try again.");
    }
  });

  return (
    <RedirectIfAuthenticated>
      <AuthShell
        title={step === "done" ? "" : "Create your account"}
        subtitle={step === "done" ? undefined : "Join JobLink in under a minute."}
        footer={
          step === "done" ? undefined : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary-700 hover:underline">
                Log in
              </Link>
            </>
          )
        }
      >
        {step === "done" ? (
          <CheckEmailNotice email={submittedEmail} />
        ) : (
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {formError && <Alert variant="danger">{formError}</Alert>}

            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-foreground">
                I&apos;m joining as
              </legend>
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
                {roleOptions.map((option) => {
                  const selected = selectedRole === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setValue("role", option.value)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                        selected
                          ? "border-primary-600 bg-primary-50/60"
                          : "border-border-strong hover:border-slate-400",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg",
                          selected ? "bg-primary-600 text-white" : "bg-surface-sunken text-slate-500",
                        )}
                      >
                        {option.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                        <span className="block text-xs text-slate-500">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <FormField label="Full name" htmlFor="register-name" required error={errors.name?.message}>
              <Input
                id="register-name"
                autoComplete="name"
                placeholder="e.g. Henok Alemu"
                invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </FormField>

            <FormField label="Email" htmlFor="register-email" required error={errors.email?.message}>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </FormField>

            <FormField
              label="Password"
              htmlFor="register-password"
              required
              error={errors.password?.message}
              hint="At least 8 characters with upper & lower case, a number, and a special character."
            >
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                invalid={Boolean(errors.password)}
                {...register("password")}
              />
            </FormField>

            <FormField
              label="Confirm password"
              htmlFor="register-confirm"
              required
              error={errors.confirmPassword?.message}
            >
              <Input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                invalid={Boolean(errors.confirmPassword)}
                {...register("confirmPassword")}
              />
            </FormField>

            <Button type="submit" fullWidth loading={isSubmitting}>
              Create account
            </Button>

            <p className="text-xs leading-relaxed text-slate-500">
              By creating an account you agree to JobLink&apos;s terms and privacy policy.
            </p>
          </form>
        )}
      </AuthShell>
    </RedirectIfAuthenticated>
  );
}