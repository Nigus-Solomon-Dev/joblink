export const siteConfig = {
  name: "JobLink",
  tagline: "Ethiopia's Leading Job Marketplace",
  description:
    "JobLink connects job seekers with employers through a fast, secure, and user-friendly hiring platform.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export type NavItem = {
  label: string;
  href: string;
  match?: (pathname: string) => boolean;
};

export type NavGroup = {
  role: "public" | "job_seeker" | "employer" | "admin";
  items: NavItem[];
};

const startsWith = (prefix: string) => (pathname: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const navGroups: NavGroup[] = [
  {
    role: "public",
    items: [
      { label: "Jobs", href: "/jobs", match: startsWith("/jobs") },
      { label: "Companies", href: "/companies", match: startsWith("/companies") },
      { label: "Categories", href: "/categories", match: startsWith("/categories") },
      { label: "Skills", href: "/skills", match: startsWith("/skills") },
    ],
  },
  {
    role: "job_seeker",
    items: [
      { label: "Dashboard", href: "/dashboard", match: startsWith("/dashboard") },
      { label: "My Applications", href: "/applications", match: startsWith("/applications") },
      { label: "Saved Jobs", href: "/saved-jobs", match: startsWith("/saved-jobs") },
      { label: "Notifications", href: "/notifications", match: startsWith("/notifications") },
      { label: "Messages", href: "/messages", match: startsWith("/messages") },
    ],
  },
  {
    role: "employer",
    items: [
      { label: "Dashboard", href: "/employer/dashboard", match: startsWith("/employer/dashboard") },
      { label: "My Jobs", href: "/employer/jobs", match: startsWith("/employer/jobs") },
      { label: "Applicants", href: "/employer/applicants", match: startsWith("/employer/applicants") },
      { label: "Company", href: "/employer/companies", match: startsWith("/employer/companies") },
      { label: "Messages", href: "/messages", match: startsWith("/messages") },
    ],
  },
  {
    role: "admin",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", match: startsWith("/admin") },
      { label: "Users", href: "/admin/users", match: startsWith("/admin/users") },
      { label: "Jobs", href: "/admin/jobs", match: startsWith("/admin/jobs") },
      { label: "Companies", href: "/admin/companies", match: startsWith("/admin/companies") },
    ],
  },
];

export function navItemsForRole(
  role: "job_seeker" | "employer" | "admin" | undefined | null,
) {
  const group = navGroups.find((g) => g.role === (role ?? "public"));
  return group?.items ?? navGroups[0].items;
}

/** Post-login landing route per role (backend defaults in dashboards/landing). */
export function homePathForRole(role: "job_seeker" | "employer" | "admin"): string {
  if (role === "employer") return "/employer/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/dashboard";
}