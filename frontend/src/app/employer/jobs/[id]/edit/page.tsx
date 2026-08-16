import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { EditJobScreen } from "@/components/employer/edit-job-screen";

export const metadata: Metadata = { title: "Edit Job" };

export default async function EditJobRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireRole roles={["employer"]}>
      <div className="container-site py-10">
        <EditJobScreen jobId={id} />
      </div>
    </RequireRole>
  );
}