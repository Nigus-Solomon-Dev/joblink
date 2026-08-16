import { cn } from "@/lib/cn";

type CompanyLogoSize = "sm" | "md" | "lg";

const sizeClasses: Record<CompanyLogoSize, string> = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
};

export interface CompanyLogoProps {
  name?: string | null;
  logo?: string | null;
  size?: CompanyLogoSize;
  className?: string;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function CompanyLogo({ name, logo, size = "md", className }: CompanyLogoProps) {
  const classes = cn(
    "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted font-semibold text-primary-700",
    sizeClasses[size],
    className,
  );

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={`${name ?? "Company"} logo`} className={classes} />;
  }

  const fallback = initials(name ?? "?");
  return (
    <span className={classes} aria-hidden="true">
      {fallback || "?"}
    </span>
  );
}