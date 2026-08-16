"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validations/auth";
import { isApiError } from "@/types/api";

export function ChangePasswordForm() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.changePasswordRequest(values);
      toast("success", "Password changed", "Please log in again with your new password.");
      await logout();
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Could not change your password. Please try again.");
      reset();
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && <Alert variant="danger">{formError}</Alert>}

      <Alert variant="info">
        Changing your password logs you out of every device for security. You&apos;ll need to log in
        again.
      </Alert>

      <FormField
        label="Current password"
        htmlFor="pw-current"
        required
        error={errors.currentPassword?.message}
      >
        <Input
          id="pw-current"
          type="password"
          autoComplete="current-password"
          invalid={Boolean(errors.currentPassword)}
          {...register("currentPassword")}
        />
      </FormField>

      <FormField
        label="New password"
        htmlFor="pw-new"
        required
        error={errors.newPassword?.message}
        hint="At least 8 characters with upper & lower case, a number, and a special character."
      >
        <Input
          id="pw-new"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.newPassword)}
          {...register("newPassword")}
        />
      </FormField>

      <FormField
        label="Confirm new password"
        htmlFor="pw-confirm"
        required
        error={errors.confirmPassword?.message}
      >
        <Input
          id="pw-confirm"
          type="password"
          autoComplete="new-password"
          invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </div>
    </form>
  );
}