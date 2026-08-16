"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";
import { Spinner } from "@/components/ui/spinner";

function FullPageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Spinner className="size-7 text-primary-600" aria-label="Loading" />
    </div>
  );
}

function Redirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}

/** Requires any authenticated user. Logged-out visitors are sent to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") return <FullPageLoader />;
  if (status === "unauthenticated") {
    return <Redirect to="/login" />;
  }
  return children;
}

/** Requires an authenticated user with one of the given roles. */
export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { status, user } = useAuth();

  if (status === "loading") return <FullPageLoader />;
  if (status === "unauthenticated") return <Redirect to="/login" />;

  if (!user || !roles.includes(user.role)) {
    return <Redirect to="/" />;
  }

  return children;
}

/** Redirects already-authenticated users away from auth pages (login/register). */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;
    const next = searchParams.get("next");
    router.replace(next && next.startsWith("/") ? next : "/");
  }, [status, searchParams, router]);

  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") return null;

  return children;
}