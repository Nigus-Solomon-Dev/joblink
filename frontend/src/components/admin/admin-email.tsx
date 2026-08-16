"use client";

import { useState } from "react";
import { Clock, MailCheck, Send, Trash2 } from "lucide-react";

import { Badge, Button, Card, FormField, Input, Skeleton } from "@/components/ui";
import { ErrorState } from "@/components/ui/error-state";
import { useClearEmailQueue, useEmailAnalytics, useEmailQueueStatus, useSendTestEmail } from "@/hooks/use-admin";

/** Admin email tooling — mirrors the exposed `/emails` admin endpoints. */
export function AdminEmailScreen() {
  const queue = useEmailQueueStatus();
  const analytics = useEmailAnalytics();
  const clear = useClearEmailQueue();
  const sendTest = useSendTestEmail();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin · Email
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Email service</h1>
        <p className="mt-1 text-sm text-slate-600">
          Queue health, configuration state and a manual test sender.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-foreground">Queue</h2>
          </div>
          {queue.isPending ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : queue.isError ? (
            <ErrorState
              title="Couldn't load the queue"
              message="We couldn't fetch the email queue status."
              onRetry={() => queue.refetch()}
              className="mt-4 py-6"
            />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Queued</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{queue.data?.queueLength ?? "–"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{queue.data?.pending ?? "–"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Processing</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{queue.data?.processing ?? "–"}</p>
              </div>
              <div className="flex items-end">
                <Badge variant={queue.data?.isConfigured ? "success" : "warning"} dot>
                  {queue.data?.isConfigured ? "Configured" : "Not configured"}
                </Badge>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <MailCheck className="size-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-foreground">Analytics</h2>
          </div>
          {analytics.isPending ? (
            <Skeleton className="mt-4 h-20 w-full" />
          ) : analytics.isError ? (
            <ErrorState
              title="Couldn't load analytics"
              message="We couldn't fetch email analytics."
              onRetry={() => analytics.refetch()}
              className="mt-4 py-6"
            />
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Transporter</dt>
                <dd className="font-medium text-foreground">{analytics.data?.transporterReady ? "Ready" : "Offline"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total queued</dt>
                <dd className="font-medium text-foreground">{analytics.data?.totalQueued ?? "–"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Configured</dt>
                <dd className="font-medium text-foreground">{analytics.data?.isConfigured ? "Yes" : "No"}</dd>
              </div>
            </dl>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Trash2 className="size-4 text-danger-600" />
            <h2 className="text-sm font-semibold text-foreground">Danger zone</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Drop all pending email jobs from the in-memory queue.
          </p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => clear.mutate()} loading={clear.isPending}>
            Clear queue
          </Button>
          {clear.isError && <p className="mt-2 text-sm text-danger-600">Couldn&rsquo;t clear the queue.</p>}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-primary-600" />
          <h2 className="text-sm font-semibold text-foreground">Send test email</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Delivers a plain HTML test message to the address below through the connected transport.
        </p>
        <div className="mt-4 grid max-w-xl gap-4 sm:grid-cols-2">
          <FormField label="Recipient">
            <Input
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="you@example.com"
            />
          </FormField>
          <FormField label="Subject (optional)">
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Test from JobLink" />
          </FormField>
        </div>
        <Button className="mt-4" disabled={!to.trim()} loading={sendTest.isPending} onClick={() => sendTest.mutate({ to, subject: subject || undefined })}>
          Send test email
        </Button>
        {sendTest.isError && (
          <p className="mt-2 text-sm text-danger-600">Couldn&rsquo;t send the test email. Check the transporter config.</p>
        )}
      </Card>
    </div>
  );
}