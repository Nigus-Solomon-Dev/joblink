import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/cn";

type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  className?: string;
  children?: ReactNode;
}

const icons: Record<AlertVariant, ReactNode> = {
  info: <Info className="size-4 shrink-0" />,
  success: <CheckCircle2 className="size-4 shrink-0" />,
  warning: <AlertTriangle className="size-4 shrink-0" />,
  danger: <AlertCircle className="size-4 shrink-0" />,
};

const styles: Record<AlertVariant, { box: string; title: string; text: string; icon: string }> = {
  info: { box: "border-info-200 bg-info-50", title: "text-info-800", text: "text-info-700", icon: "text-info-600" },
  success: {
    box: "border-success-200 bg-success-50",
    title: "text-success-800",
    text: "text-success-700",
    icon: "text-success-600",
  },
  warning: {
    box: "border-warning-200 bg-warning-50",
    title: "text-warning-800",
    text: "text-warning-700",
    icon: "text-warning-600",
  },
  danger: {
    box: "border-danger-200 bg-danger-50",
    title: "text-danger-800",
    text: "text-danger-700",
    icon: "text-danger-600",
  },
};

export function Alert({ variant = "info", title, className, children }: AlertProps) {
  const s = styles[variant];
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", s.box, className)}
    >
      <span className={cn("mt-0.5", s.icon)}>{icons[variant]}</span>
      <div className="min-w-0 text-sm">
        {title && <p className={cn("font-semibold", s.title)}>{title}</p>}
        {children && <div className={cn("mt-0.5", s.text)}>{children}</div>}
      </div>
    </div>
  );
}