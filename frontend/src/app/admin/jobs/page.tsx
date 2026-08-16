import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminJobsScreen } from "@/components/admin/admin-jobs";

export const metadata: Metadata = { title: "Job Management" };

export default function AdminJobsRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminJobsScreen />
      </div>
    </RequireRole>
  );
}