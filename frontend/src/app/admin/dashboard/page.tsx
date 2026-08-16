import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboardRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminDashboard />
      </div>
    </RequireRole>
  );
}