import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Shared chrome for authentication screens.
 *
 * A warm, editorial split: an apricot "statement" side with hand-drawn
 * underline, beside a quiet form column on warm paper. No icon badges,
 * no glassmorphism, no stock dashboard framing.
 */
export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="container-site py-8 md:py-12">
      <div className="grid overflow-hidden rounded-2xl border border-border-strong bg-surface lg:grid-cols-[1.15fr_1fr] lg:shadow-card">
        <aside className="relative flex flex-col justify-between gap-12 overflow-hidden bg-gradient-to-br from-accent-50 via-accent-50 to-accent-100 px-7 py-9 sm:px-11 lg:px-14 lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent-500/15 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-8 size-80 rounded-full bg-primary-200/40 blur-[70px]"
          />

          <Brand className="relative" />

          <div className="relative">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent-700">
              Hiring without the noise
            </p>
            <h2 className="mt-5 max-w-sm text-3xl font-bold leading-[1.08] tracking-tight text-primary-950 sm:text-4xl">
              Find work that&apos;s{" "}
              <span className="text-accent-600">worth your week.</span>
            </h2>
            <svg
              aria-hidden="true"
              className="mt-6 text-accent-600"
              width="88"
              height="12"
              viewBox="0 0 88 12"
              fill="none"
            >
              <path
                d="M1 9.5C23 3.5 45 4.5 87 2"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-primary-800/85">
              One account for job seekers, employers, and hiring teams — every detail kept where it
              belongs, nothing lost to the shuffle.
            </p>
          </div>

          <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-primary-900/75">
            <span>For job seekers</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-accent-600" />
            <span>For employers</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-accent-600" />
            <span>For teams</span>
          </div>
        </aside>

        <div className="flex flex-col px-6 py-10 sm:px-11 lg:px-14 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <Brand size="md" className="lg:hidden" />
            <p className="mt-6 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-accent-700 lg:mt-0">
              <span aria-hidden="true" className="inline-block size-2 bg-accent-600" />
              Account
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
            <div className="mt-7">{children}</div>

            {footer && (
              <div className="mt-8 border-t border-border pt-5 text-center text-sm">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}