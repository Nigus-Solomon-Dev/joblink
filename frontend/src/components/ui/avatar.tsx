import { cn } from "@/lib/cn";
import { resolveMediaUrl } from "@/lib/media";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
  xl: "size-20 text-xl",
};

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
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

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const fallback = initials(name ?? "?");
  const classes = cn(
    "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-800",
    sizeClasses[size],
    className,
  );

  if (src) {
    const resolved = resolveMediaUrl(src);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolved} alt={name ?? "Avatar"} className={classes} />;
  }

  return (
    <span className={classes} aria-hidden="true">
      {fallback || "?"}
    </span>
  );
}