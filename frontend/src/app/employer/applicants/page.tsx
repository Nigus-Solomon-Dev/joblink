import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { ApplicantsScreen } from "@/components/employer/applicants-screen";

export const metadata: Metadata = { title: "Applicants" };

export default function EmployerApplicantsRoute() {
  return (
    <RequireRole roles={["employer"]}>
      <div className="container-site py-10">
        <ApplicantsScreen />
      </div>
    </RequireRole>
  );
}