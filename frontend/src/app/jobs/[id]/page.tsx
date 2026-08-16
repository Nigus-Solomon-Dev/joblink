import { JobDetailScreen } from "@/components/jobs/job-detail-screen";

export default async function JobDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobDetailScreen jobId={id} />;
}