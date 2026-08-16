import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium " +
  "transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white shadow-primary hover:bg-primary-700 active:bg-primary-800 focus-visible:outline-primary-600",
  secondary:
    "bg-surface text-foreground border border-border-strong hover:bg-surface-muted focus-visible:outline-primary-600",
  outline:
    "border border-border-strong text-primary-700 hover:bg-primary-50 focus-visible:outline-primary-600",
  ghost: "text-foreground hover:bg-surface-muted focus-visible:outline-primary-600",
  danger: "bg-danger-600 text-white hover:bg-danger-700 focus-visible:outline-danger-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
  icon: "size-10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, fullWidth, disabled, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading && <Spinner className="size-4" aria-label="Loading" />}
      {children}
    </button>
  );
});