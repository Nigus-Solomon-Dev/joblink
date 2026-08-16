import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSettingsScreen } from "@/components/admin/admin-settings";

export const metadata: Metadata = { title: "Platform Settings" };

export default function AdminSettingsRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminSettingsScreen />
      </div>
    </RequireRole>
  );
}