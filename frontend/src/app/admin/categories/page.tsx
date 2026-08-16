import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminCategoriesSkillsScreen } from "@/components/admin/admin-categories";

export const metadata: Metadata = { title: "Categories & Skills" };

export default function AdminCategoriesRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminCategoriesSkillsScreen />
      </div>
    </RequireRole>
  );
}