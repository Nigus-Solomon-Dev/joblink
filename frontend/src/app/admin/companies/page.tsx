import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminCompaniesScreen } from "@/components/admin/admin-companies";

export const metadata: Metadata = { title: "Company Management" };

export default function AdminCompaniesRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminCompaniesScreen />
      </div>
    </RequireRole>
  );
}