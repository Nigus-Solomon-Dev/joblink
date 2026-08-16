import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { CompanyManager } from "@/components/employer/company-manager";

export const metadata: Metadata = { title: "My Company" };

export default function EmployerCompaniesRoute() {
  return (
    <RequireRole roles={["employer"]}>
      <div className="container-site py-10">
        <CompanyManager />
      </div>
    </RequireRole>
  );
}