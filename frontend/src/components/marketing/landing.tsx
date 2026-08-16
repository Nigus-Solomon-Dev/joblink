"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, Search } from "lucide-react";

import { useCompanies } from "@/hooks/use-companies";
import { useCategoriesWithJobs, useTopSkills } from "@/hooks/use-categories";
import { useFeaturedJobs } from "@/hooks/use-jobs";
import { CompanyLogo } from "@/components/companies/company-logo";
import { JobCard } from "@/components/jobs/job-card";
import { JobCardListSkeleton } from "@/components/jobs/job-card-skeleton";
import { Button, Input, Reveal, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

const heroSearchSchema = z.object({ query: z.string().trim().min(1, "Type a job title or keyword") });
type HeroSearchValues = z.infer<typeof heroSearchSchema>;

const steps = [
  {
    title: "Build your profile",
    description: "Tell hiring teams who you are, your skills, and what you're looking for.",
  },
  {
    title: "Discover the right roles",
    description: "Search thousands of jobs, filter by salary and location, and save what you like.",
  },
  {
    title: "Apply in minutes",
    description: "Send a focused application and track its progress from one place.",
  },
];

const features = [
  {
    title: "Real opportunities",
    description: "Every listing is posted by a verified company — no spam, no dead ends.",
  },
  {
    title: "Salary up front",
    description: "See pay ranges before you apply, so your time is never wasted.",
  },
  {
    title: "Built for Ethiopia",
    description: "Roles, salaries, and hiring practices made for the local market.",
  },
];

export function Landing() {
  const router = useRouter();
  const featured = useFeaturedJobs();
  const categories = useCategoriesWithJobs();
  const skills = useTopSkills(12);
  const companies = useCompanies({ isVerified: true, limit: 8 });
  const featuredJobs = featured.data?.jobs ?? [];
  const trustedCompanies = companies.data?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HeroSearchValues>({ resolver: zodResolver(heroSearchSchema) });

  const onSubmit = handleSubmit(({ query }) => {
    router.push(`/jobs?query=${encodeURIComponent(query)}`);
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(120%_120%_at_50%_-10%,#fdf4ea_0%,#f5f0e7_55%,#f0e5d3_100%)]">
        <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-accent-500/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-32 bottom-0 size-80 rounded-full bg-primary-200/20 blur-3xl" aria-hidden="true" />

        <div className="container-site relative py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p
              className="animate-rise text-xs font-semibold uppercase tracking-[0.2em] text-primary-600"
              style={{ animationDelay: "80ms" }}
            >
              Ethiopia&rsquo;s job marketplace
            </p>
            <h1
              className="animate-rise mt-4 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl"
              style={{ animationDelay: "180ms" }}
            >
              Find work that&rsquo;s <span className="text-accent-700">worth your week.</span>
            </h1>
            <p
              className="animate-rise mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg"
              style={{ animationDelay: "300ms" }}
            >
              Browse verified jobs across Addis Ababa and beyond — with transparent salaries and a
              simple way to apply.
            </p>

            <form
              onSubmit={onSubmit}
              className="animate-rise mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-xl border border-border bg-surface p-2 shadow-popover sm:flex-row"
              style={{ animationDelay: "420ms" }}
              noValidate
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  placeholder="Job title, keyword, or company…"
                  className="border-0 pl-9 shadow-none focus:ring-0"
                  aria-label="Search for jobs"
                  {...register("query")}
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0">
                Search jobs
                <ArrowRight className="size-4" />
              </Button>
            </form>
            {errors.query && (
              <p role="alert" className="mt-2 text-sm font-medium text-danger-600">
                {errors.query.message}
              </p>
            )}

            <div
              className="animate-rise mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500"
              style={{ animationDelay: "540ms" }}
            >
              <span>Popular:</span>
              {skills.data?.skills.slice(0, 5).map((skill) => (
                <button
                  key={skill._id}
                  type="button"
                  onClick={() => router.push(`/jobs?query=${encodeURIComponent(skill.name)}`)}
                  className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why / steps */}
      <section className="container-site py-16">
        <Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-border bg-surface p-6 shadow-card">
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Featured jobs */}
      <section className="container-site pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Fresh this week</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Featured jobs</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/jobs")}>
            View all jobs
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <Reveal className="mt-6">
          {featured.isLoading ? (
            <JobCardListSkeleton count={6} />
          ) : featured.isError ? (
            <p className="rounded-xl border border-border bg-surface p-6 text-sm text-slate-500">
              Featured jobs are on their way — check back soon.
            </p>
          ) : featuredJobs.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-6 text-sm text-slate-500">
              No featured jobs right now. Browse all open roles.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </Reveal>
      </section>

      {/* Categories */}
      <section className="border-y border-border bg-surface-muted/60 py-16">
        <div className="container-site">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Browse by field</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Explore categories</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/categories")}>
              All categories
              <ArrowRight className="size-4" />
            </Button>
          </div>

          <Reveal className="mt-6" delay={80}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.isLoading
                ? Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)
                : (categories.data?.categories ?? []).slice(0, 8).map((category) => (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => router.push(`/jobs?query=${encodeURIComponent(category.name)}`)}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-4 text-left shadow-card transition-colors hover:border-primary-300 hover:bg-primary-50"
                    >
                      <span className="text-sm font-medium text-foreground group-hover:text-primary-800">
                        {category.name}
                      </span>
                      {category.jobsCount ? (
                        <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                          {category.jobsCount}
                        </span>
                      ) : null}
                    </button>
                  ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trusted companies */}
      {trustedCompanies.length > 0 && (
        <section className="container-site py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Hiring through JobLink
          </p>
          <Reveal className="mt-6" delay={80}>
            <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
              {trustedCompanies.map((company) => (
                <button
                  key={company._id}
                  type="button"
                  onClick={() => router.push(`/companies/${company.slug}`)}
                  className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100"
                >
                  <CompanyLogo name={company.name} logo={company.logo} size="sm" />
                  <span className="text-sm font-medium text-slate-600">{company.name}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* How it works */}
      <section className="container-site pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">How it works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">From search to offer in three steps</h2>
        </div>
        <Reveal className="mt-10">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className={cn("relative rounded-xl border border-border bg-surface p-6 shadow-card", "flex flex-col")}>
                <span className="grid size-9 place-items-center rounded-full bg-accent-500/15 text-sm font-bold text-accent-700">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Employer CTA */}
      <section className="border-t border-border bg-espresso-950">
        <div className="container-site flex flex-col items-start justify-between gap-6 py-14 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-500">For employers</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Hiring in Addis? Post a job in minutes.</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Create a company page, publish your first role, and start receiving qualified applications today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-accent-500 text-espresso-950 shadow-primary hover:bg-accent-600"
            >
              Post a job
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/register")}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Join as an employer
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}