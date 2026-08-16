import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminAnalyticsScreen } from "@/components/admin/admin-analytics";

export const metadata: Metadata = { title: "Platform Analytics" };

export default function AdminAnalyticsRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminAnalyticsScreen />
      </div>
    </RequireRole>
  );
}