import { Suspense } from "react";

import { LoginPage as LoginForm } from "@/components/auth/login-form";
import { Spinner } from "@/components/ui";

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="size-6 text-primary-600" aria-label="Loading" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}