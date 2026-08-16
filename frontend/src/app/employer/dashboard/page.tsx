import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { EmployerDashboard } from "@/components/employer/employer-dashboard";

export const metadata: Metadata = { title: "Employer Dashboard" };

export default function EmployerDashboardRoute() {
  return (
    <RequireRole roles={["employer"]}>
      <div className="container-site py-10">
        <EmployerDashboard />
      </div>
    </RequireRole>
  );
}