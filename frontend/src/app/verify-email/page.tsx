import { Suspense } from "react";

import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { Spinner } from "@/components/ui";

export default function VerifyEmailRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="size-6 text-primary-600" aria-label="Loading" />
        </div>
      }
    >
      <VerifyEmailCard />
    </Suspense>
  );
}