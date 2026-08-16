import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminEmailScreen } from "@/components/admin/admin-email";

export const metadata: Metadata = { title: "Email Admin" };

export default function AdminEmailRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminEmailScreen />
      </div>
    </RequireRole>
  );
}