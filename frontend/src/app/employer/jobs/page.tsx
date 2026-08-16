import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { MyJobsScreen } from "@/components/employer/my-jobs-screen";

export const metadata: Metadata = { title: "My Jobs" };

export default function EmployerJobsRoute() {
  return (
    <RequireRole roles={["employer"]}>
      <div className="container-site py-10">
        <MyJobsScreen />
      </div>
    </RequireRole>
  );
}