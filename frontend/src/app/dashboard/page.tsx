import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { SeekerDashboard } from "@/components/seeker/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardRoute() {
  return (
    <RequireRole roles={["job_seeker"]}>
      <div className="container-site py-10">
        <SeekerDashboard />
      </div>
    </RequireRole>
  );
}