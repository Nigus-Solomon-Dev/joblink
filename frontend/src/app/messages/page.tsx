import { Suspense } from "react";
import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/guards";
import { MessagesScreen } from "@/components/messages/messages-screen";
import { Spinner } from "@/components/ui";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesRoute() {
  return (
    <RequireAuth>
      <div className="container-site py-6 sm:py-10">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <Spinner className="size-6 text-primary-600" aria-label="Loading messages" />
            </div>
          }
        >
          <MessagesScreen />
        </Suspense>
      </div>
    </RequireAuth>
  );
}