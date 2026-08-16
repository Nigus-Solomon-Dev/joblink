import Link from "next/link";

import { Button } from "@/components/ui";
import { siteConfig } from "@/config/site";

export const metadata = { title: "About" };

const values = [
  {
    title: "Honest listings",
    description:
      "We want every job on JobLink to be real, current, and posted by a verified team — so your time is never wasted.",
  },
  {
    title: "Transparent pay",
    description:
      "Salary ranges are shown up front. You should know what a role is worth before you apply, not after an interview.",
  },
  {
    title: "Built for Ethiopia",
    description:
      "From Addis Ababa to the regions, roles, salaries, and hiring practices are shaped for the local market.",
  },
];

export default function AboutPage() {
  return (
    <div className="container-site py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          About {siteConfig.name}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          A calmer way to find and fill jobs
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
          <p>
            {siteConfig.name} started with a simple frustration: hiring in Ethiopia too often means
            scattered posts, hidden salaries, and applications that vanish into a black hole. We
            wanted a single place where real jobs meet real people — quickly, transparently, and
            with respect for everyone&rsquo;s time.
          </p>
          <p>
            For job seekers, that means honest listings with visible pay, a fast way to apply, and
            a way to keep track of everything you&rsquo;ve sent out. For employers, it means a
            focused channel to publish roles and manage candidates without the noise.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
        {values.map((value) => (
          <div key={value.title} className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <h2 className="text-base font-semibold text-foreground">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{value.description}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-espresso-950 p-8 text-center sm:p-10">
        <h2 className="text-xl font-bold tracking-tight text-white">Ready to get started?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          Whether you&rsquo;re looking for your next role or hiring your next teammate, {siteConfig.name}{" "}
          is here.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/jobs">
            <Button variant="primary" className="bg-accent-500 text-espresso-950 shadow-primary hover:bg-accent-600">
              Browse jobs
            </Button>
          </Link>
          <Link href="/companies">
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              Explore companies
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}