import { Suspense } from "react";

import { RegisterPage as RegisterForm } from "@/components/auth/register-form";
import { Spinner } from "@/components/ui";

export default function RegisterRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="size-6 text-primary-600" aria-label="Loading" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}