import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { JobForm } from "@/components/employer/job-form";

export const metadata: Metadata = { title: "Post a Job" };

export default function NewJobRoute() {
  return (
    <RequireRole roles={["employer"]}>
      <div className="container-site py-10">
        <JobForm mode="create" />
      </div>
    </RequireRole>
  );
}