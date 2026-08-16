import { Suspense } from "react";

import { JobSearchScreen } from "@/components/jobs/job-search-screen";
import { Spinner } from "@/components/ui";

export const metadata = { title: "Jobs" };

export default function JobsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="size-6 text-primary-600" aria-label="Loading" />
        </div>
      }
    >
      <JobSearchScreen />
    </Suspense>
  );
}