import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/guards";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { TelegramNotificationsCard } from "@/components/profile/telegram-notifications-card";
import { Card } from "@/components/ui";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default function ProfileRoute() {
  return (
    <RequireAuth>
      <div className="container-site py-10">
        <header className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep your details up to date so recruiters see your best self.
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card className="h-fit">
              <h2 className="text-base font-semibold text-foreground">Personal information</h2>
              <p className="mb-6 mt-0.5 text-sm text-slate-500">
                These fields are shown to employers when you apply.
              </p>
              <ProfileForm />
            </Card>
            <TelegramNotificationsCard />
          </div>
          <ProfileSidebar />
        </div>
      </div>
    </RequireAuth>
  );
}