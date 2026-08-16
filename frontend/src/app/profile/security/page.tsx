import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/guards";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { Card } from "@/components/ui";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export const metadata: Metadata = { title: "Security" };

export default function ProfileSecurityRoute() {
  return (
    <RequireAuth>
      <div className="container-site py-10">
        <header className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Security</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage the password for your JobLink account.
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <Card className="h-fit">
            <h2 className="text-base font-semibold text-foreground">Change password</h2>
            <p className="mb-6 mt-0.5 text-sm text-slate-500">
              Use a strong password you don&apos;t reuse elsewhere.
            </p>
            <ChangePasswordForm />
          </Card>
          <ProfileSidebar />
        </div>
      </div>
    </RequireAuth>
  );
}