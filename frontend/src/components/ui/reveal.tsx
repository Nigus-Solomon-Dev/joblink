"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds — useful when several reveals follow each other. */
  delay?: number;
}

/**
 * Fades content upward as it scrolls into view. Content mounts hidden, so it is
 * only ever animated in — never out. `prefers-reduced-motion` users get the
 * transition collapsed to ~0ms by the global stylesheet rule.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}