import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui";
import { siteConfig } from "@/config/site";

export const metadata = { title: "Contact" };

const channels = [
  {
    icon: <Mail className="size-5" />,
    title: "Email us",
    description: "For questions about your account, a listing, or anything else.",
    action: "Write to us",
    href: "mailto:hello@joblink.et",
  },
  {
    icon: <MessageCircle className="size-5" />,
    title: "For employers",
    description: "Curious about posting roles or setting up your company page?",
    action: "Start here",
    href: "/register",
  },
  {
    icon: <MapPin className="size-5" />,
    title: "Visit us",
    description: "Bole Road, Addis Ababa, Ethiopia. By appointment.",
    action: "Plan a visit",
    href: "https://maps.google.com/?q=Addis+Ababa,+Ethiopia",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="container-site py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Contact
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Talk to {siteConfig.name}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
          We read everything that comes in. If something isn&rsquo;t working — a listing looks off, an
          application didn&rsquo;t send, or you just have an idea — reach out.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
        {channels.map((channel) => (
          <a
            key={channel.title}
            href={channel.href}
            target={channel.href.startsWith("http") ? "_blank" : undefined}
            rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group flex flex-col rounded-xl border border-border bg-surface p-6 shadow-card transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            <span className="grid size-10 place-items-center rounded-full bg-primary-50 text-primary-700">
              {channel.icon}
            </span>
            <h2 className="mt-4 text-base font-semibold text-foreground">{channel.title}</h2>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">
              {channel.description}
            </p>
            <span className="mt-4 text-sm font-medium text-primary-700 group-hover:underline">
              {channel.action} →
            </span>
          </a>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-surface-muted/60 p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Prefer a job-specific question?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          Questions about a specific listing should go to the company that posted it — you can open
          the job and choose to apply, and the employer&rsquo;s team will be in touch.
        </p>
        <Link
          href="/jobs"
          className="mt-5 inline-flex"
        >
          <Button variant="outline">Browse jobs</Button>
        </Link>
      </div>
    </div>
  );
}