import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { SavedJobsScreen } from "@/components/seeker/saved-jobs-screen";

export const metadata: Metadata = { title: "Saved Jobs" };

export default function SavedJobsRoute() {
  return (
    <RequireRole roles={["job_seeker"]}>
      <div className="container-site py-10">
        <SavedJobsScreen />
      </div>
    </RequireRole>
  );
}