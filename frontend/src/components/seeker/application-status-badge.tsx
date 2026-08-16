import type { ApplicationStatus } from "@/types";

import { Badge } from "@/components/ui";
import { applicationStatusLabels } from "@/lib/format";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "outline";

const statusVariant: Record<ApplicationStatus, BadgeVariant> = {
  pending: "neutral",
  under_review: "info",
  shortlisted: "primary",
  interview_scheduled: "warning",
  interviewed: "info",
  offered: "success",
  accepted: "success",
  rejected: "danger",
  withdrawn: "neutral",
};

export function ApplicationStatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <Badge variant={statusVariant[status]} dot className={className}>
      {applicationStatusLabels[status]}
    </Badge>
  );
}