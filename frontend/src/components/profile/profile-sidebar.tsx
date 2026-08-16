"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LogOut, UserRound } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/lib/cn";

const accountNav = [
  { label: "Personal information", href: "/profile", icon: <UserRound className="size-4" /> },
  { label: "Security & password", href: "/profile/security", icon: <KeyRound className="size-4" /> },
] as const;

export function ProfileSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <aside className="space-y-4">
      <Card className="space-y-4">
        <AvatarUploader />
        {user && (
          <div className="flex justify-center">
            <Badge variant={user.role === "employer" ? "info" : "neutral"}>
              {user.role === "job_seeker" ? "Job seeker" : user.role}
            </Badge>
          </div>
        )}
      </Card>

      <Card padding="sm" className="divide-y divide-border">
        {accountNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-slate-600 hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
        <div className="pt-2">
          <Button variant="ghost" size="sm" fullWidth onClick={() => void logout()}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </Card>
    </aside>
  );
}