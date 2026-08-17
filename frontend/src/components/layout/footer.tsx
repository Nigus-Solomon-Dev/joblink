import Link from "next/link";

import { siteConfig } from "@/config/site";
import { Brand } from "@/components/layout/brand";

const footerColumns = [
  {
    heading: "For job seekers",
    links: [
      { label: "Browse jobs", href: "/jobs" },
      { label: "Browse companies", href: "/companies" },
      { label: "Browse categories", href: "/categories" },
      { label: "Explore skills", href: "/skills" },
    ],
  },
  {
    heading: "For employers",
    links: [
      { label: "Post a job", href: "/register?role=employer" },
      { label: "Create a company page", href: "/register?role=employer" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy policy", href: "/about" },
      { label: "Terms", href: "/about" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-espresso-950 text-slate-300">
      <div className="container-site grid gap-10 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs space-y-3">
          <Brand tone="light" />
          <p className="text-sm leading-relaxed text-slate-400">{siteConfig.tagline}</p>
        </div>

        {footerColumns.map((column) => (
          <nav key={column.heading} aria-label={column.heading} className="space-y-3">
            <h3 className="text-sm font-semibold text-white">{column.heading}</h3>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>{siteConfig.description}</p>
        </div>
      </div>
    </footer>
  );
}