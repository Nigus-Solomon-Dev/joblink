import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Spinner } from "@/components/ui";

export default function ResetPasswordRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="size-6 text-primary-600" aria-label="Loading" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}