"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";

import { homePathForRole, navItemsForRole } from "@/config/site";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadNotifications } from "@/hooks/use-notifications";
import { useMessagingUnread } from "@/hooks/use-messages";
import { cn } from "@/lib/cn";
import { Brand } from "@/components/layout/brand";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const authenticated = status === "authenticated" && user;
  const navItems = navItemsForRole(user?.role);
  const dashboardHref = user ? homePathForRole(user.role) : "/dashboard";
  const { data: unreadResult } = useUnreadNotifications();
  const { data: messagingUnread } = useMessagingUnread();
  const unreadCount = authenticated ? (unreadResult?.count ?? 0) : 0;
  const chatUnread = authenticated ? (messagingUnread?.total ?? 0) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Brand />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const showChatBadge = item.href === "/messages" && chatUnread > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {item.label}
                {showChatBadge && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent-600 px-1 text-[10px] font-bold leading-4 text-white">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authenticated && user ? (
            <>
              <Link href="/notifications" className="relative" aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}>
                <Button variant="ghost" size="icon">
                  <Bell className="size-4" />
                </Button>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent-600 px-1 text-[10px] font-bold leading-4 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link href={dashboardHref}>
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2 pl-2">
                <Link href="/profile" className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-muted">
                  <Avatar src={user.avatar} name={user.name} size="sm" />
                  <span className="max-w-32 truncate text-sm font-medium text-foreground">{user.name}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void logout()}
                  aria-label="Log out"
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav aria-label="Mobile" className="container-site flex flex-col gap-1 py-3">
            {navItems.map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              const showChatBadge = item.href === "/messages" && chatUnread > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-primary-50 text-primary-700" : "text-slate-600 hover:bg-surface-muted",
                  )}
                >
                  {item.label}
                  {showChatBadge && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-accent-600 px-1.5 text-[10px] font-bold leading-5 text-white">
                      {chatUnread > 9 ? "9+" : chatUnread}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {authenticated && user ? (
                <>
                  <Link href={dashboardHref} onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" fullWidth>
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/notifications" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" fullWidth>
                      <Bell className="size-4" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-accent-600 px-1.5 text-[10px] font-bold leading-5 text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileOpen(false);
                      void logout();
                    }}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="secondary" fullWidth>
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button fullWidth>Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}