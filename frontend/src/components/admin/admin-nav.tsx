"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Building2,
  Briefcase,
  FolderTree,
  LayoutDashboard,
  Mail,
  Settings,
  Users,
} from "lucide-react";

import { cn } from "@/lib/cn";

const ADMIN_LINKS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Analytics", href: "/admin/analytics", icon: Activity },
  { label: "Email", href: "/admin/email", icon: Mail },
  { label: "Telegram", href: "/admin/telegram", icon: Bot },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {ADMIN_LINKS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary-50 text-primary-700"
                : "text-slate-600 hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}