import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { ApplicationsScreen } from "@/components/seeker/applications-screen";

export const metadata: Metadata = { title: "My Applications" };

export default function ApplicationsRoute() {
  return (
    <RequireRole roles={["job_seeker"]}>
      <div className="container-site py-10">
        <ApplicationsScreen />
      </div>
    </RequireRole>
  );
}