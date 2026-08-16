import Link from "next/link";

import { cn } from "@/lib/cn";

type BrandTone = "dark" | "light";
type BrandSize = "sm" | "md" | "lg";

const toneClasses: Record<
  BrandTone,
  { base: string; accent: string }
> = {
  dark: { base: "text-foreground", accent: "text-primary-600" },
  light: { base: "text-white", accent: "text-primary-300" },
};

const sizeClasses: Record<BrandSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export interface BrandProps {
  tone?: BrandTone;
  size?: BrandSize;
  /** Draws a small accent underline beneath the wordmark (used on feature surfaces). */
  marked?: boolean;
  href?: string;
  className?: string;
}

export function Brand({ tone = "dark", size = "sm", marked = false, href = "/", className }: BrandProps) {
  const t = toneClasses[tone];
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex flex-col gap-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
        className,
      )}
    >
      <span className={cn("leading-none font-extrabold tracking-tight", sizeClasses[size], t.base)}>
        Job
        <span className={t.accent}>Link</span>
      </span>
      {marked && (
        <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent-500" />
      )}
    </Link>
  );
}