import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminUsersScreen } from "@/components/admin/admin-users";

export const metadata: Metadata = { title: "User Management" };

export default function AdminUsersRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminUsersScreen />
      </div>
    </RequireRole>
  );
}