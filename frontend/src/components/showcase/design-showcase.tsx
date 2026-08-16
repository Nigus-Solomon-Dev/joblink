"use client";

import { useState } from "react";
import { Mail, Plus } from "lucide-react";

import { Avatar, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-20">
      <h2 id={`${id}-heading`} className="text-xl font-semibold text-foreground">
        {title}
      </h2>
      <Card className="mt-4">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
      </Card>
    </section>
  );
}

function DemoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </div>
  );
}

export function DesignShowcase() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState("overview");

  return (
    <div className="space-y-12 py-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">JobLink design system</h1>
        <p className="max-w-2xl text-slate-600">
          Phase 0 foundation. Tokens live in{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">globals.css</code> and primitives
          export from <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">@/components/ui</code>.
        </p>
      </section>

      <Section id="colors" title="Color tokens">
        {[
          ["Surface", "bg-surface"],
          ["Surface muted", "bg-surface-muted"],
          ["Primary 600", "bg-primary-600"],
          ["Accent 600", "bg-accent-600"],
          ["Success 600", "bg-success-600"],
          ["Danger 600", "bg-danger-600"],
          ["Warning 600", "bg-warning-600"],
          ["Info 600", "bg-info-600"],
        ].map(([label, swatch]) => (
          <DemoItem key={swatch} label={label}>
            <div className={`h-16 w-full rounded-lg ${swatch}`} />
          </DemoItem>
        ))}
      </Section>

      <Section id="buttons" title="Buttons">
        <DemoItem label="Variants">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </DemoItem>
        <DemoItem label="Sizes">
          <div className="flex items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add">
              <Plus className="size-4" />
            </Button>
          </div>
        </DemoItem>
        <DemoItem label="With icon">
          <Button>
            <Mail className="size-4" />
            With icon
          </Button>
        </DemoItem>
        <DemoItem label="Loading">
          <Button loading>Loading</Button>
        </DemoItem>
      </Section>

      <Section id="forms" title="Form controls">
        <DemoItem label="Input">
          <Input placeholder="Search jobs" />
        </DemoItem>
        <DemoItem label="Textarea">
          <Textarea placeholder="Write a note..." className="min-h-24" />
        </DemoItem>
        <DemoItem label="Select">
          <Select defaultValue="full_time">
            <option value="part_time">Part-time</option>
            <option value="full_time">Full-time</option>
            <option value="contract">Contract</option>
          </Select>
        </DemoItem>
        <div className="col-span-2 space-y-3 lg:col-span-4">
          <FormField label="Job title" htmlFor="demo-title" required hint="e.g. Senior Product Designer">
            <Input id="demo-title" placeholder="e.g. Senior Product Designer" />
          </FormField>
          <FormField label="Salary range" htmlFor="demo-salary" error="Please enter a valid salary range.">
            <Input id="demo-salary" placeholder="$60,000 – $80,000" />
          </FormField>
          <div className="flex gap-2">
            <Checkbox id="demo-remote" label="Remote-friendly" defaultChecked />
            <Checkbox id="demo-urgent" label="Urgent hiring" />
          </div>
        </div>
      </Section>

      <Section id="displays" title="Badges, avatars, cards">
        <DemoItem label="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">Pending</Badge>
            <Badge variant="danger">Expired</Badge>
            <Badge variant="info">New</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge dot>Online</Badge>
          </div>
        </DemoItem>
        <DemoItem label="Avatars">
          <div className="flex items-center gap-3">
            <Avatar name="Jane Cooper" size="sm" />
            <Avatar name="Jane Cooper" size="md" />
            <Avatar name="Wade Warren" size="lg" />
          </div>
        </DemoItem>
        <DemoItem label="Skeleton">
          <div className="w-full space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </DemoItem>
        <DemoItem label="Spinner">
          <Spinner />
        </DemoItem>
      </Section>

      <Section id="interactive" title="Interactive">
        <DemoItem label="Tabs">
          <Tabs
            value={tab}
            onValueChange={setTab}
            items={[
              { value: "overview", label: "Overview" },
              { value: "details", label: "Details" },
              { value: "activity", label: "Activity" },
            ]}
          />
          <div className="w-full">
            <TabContent value="overview" activeValue={tab} className="p-4 text-sm text-slate-600">
              High-level summary of the resource goes here.
            </TabContent>
            <TabContent value="details" activeValue={tab} className="p-4 text-sm text-slate-600">
              Detailed information about the resource goes here.
            </TabContent>
            <TabContent value="activity" activeValue={tab} className="p-4 text-sm text-slate-600">
              Recent activity events appear here.
            </TabContent>
          </div>
        </DemoItem>
        <DemoItem label="Modal">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Confirmation"
            description="Modal primitives are composed on top of the design tokens."
          >
            <p className="text-sm text-slate-600">
              This modal handles Escape-to-close, backdrop click, focus-visible on the close control, and body
              scroll locking. Drill further into a dialog from here.
            </p>
          </Modal>
        </DemoItem>
        <DemoItem label="Toast">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => toast("success", "Application saved", "Your profile update was saved successfully.")}>
              Success toast
            </Button>
            <Button variant="secondary" onClick={() => toast("error", "Request failed", "Something went wrong. Please try again.")}>
              Error toast
            </Button>
            <Button variant="secondary" onClick={() => toast("info", "Heads up", "New messages are highlighted in the sidebar.")}>
              Info toast
            </Button>
          </div>
        </DemoItem>
        <DemoItem label="Pagination">
          <Pagination page={page} totalPages={9} onPageChange={setPage} />
        </DemoItem>
      </Section>

      <Section id="states" title="Empty / error states">
        <div className="col-span-2 lg:col-span-2">
          <EmptyState
            title="No saved jobs yet"
            description="When you save a job, it will show up here for quick access."
            actionLabel="Browse jobs"
            onAction={() => void 0}
          />
        </div>
        <div className="col-span-2 lg:col-span-2">
          <ErrorState
            title="Could not load jobs"
            message="Make sure the JobLink API is running on port 5000, then retry."
            onRetry={() => toast("info", "Retrying", "Re-requesting the jobs feed…")}
          />
        </div>
      </Section>
    </div>
  );
}