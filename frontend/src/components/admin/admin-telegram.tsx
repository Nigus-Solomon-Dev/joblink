"use client";

import { useState } from "react";
import { Bot, Megaphone, Send, SendHorizonal } from "lucide-react";

import { Badge, Button, Card, FormField, Input, Textarea } from "@/components/ui";
import { ErrorState } from "@/components/ui/error-state";
import {
  useTelegramBotInfo,
  useTelegramBotStatus,
  useTelegramBroadcast,
  useTelegramSendJobAlert,
  useTelegramSendToUser,
} from "@/hooks/use-admin";

export function AdminTelegramScreen() {
  const info = useTelegramBotInfo();
  const status = useTelegramBotStatus();
  const broadcast = useTelegramBroadcast();
  const sendUser = useTelegramSendToUser();
  const sendAlert = useTelegramSendJobAlert();

  const [broadcastText, setBroadcastText] = useState("");
  const [userId, setUserId] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [alertUserId, setAlertUserId] = useState("");
  const [alertJobId, setAlertJobId] = useState("");

  const botName = info.data?.info?.first_name ?? info.data?.info?.username ?? "JobLink bot";

  if (info.isError || status.isError) {
    return (
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Admin · Telegram
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Telegram bot</h1>
        </header>
        <ErrorState
          title="Couldn't check the Telegram bot"
          message="We couldn't reach the bot configuration endpoint."
          onRetry={() => {
            void info.refetch();
            void status.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin · Telegram
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Telegram bot</h1>
        <p className="mt-1 text-sm text-slate-600">
          Broadcasts and direct notifications through the connected bot.
        </p>
      </header>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
            <Bot className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-semibold text-foreground">{botName}</h2>
              <Badge variant={status.data?.configured ? "success" : "warning"} dot>
                {status.data?.configured ? "Running" : "Not configured"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {info.data?.configured
                ? info.data?.error
                  ? `Connected but reporting a problem: ${info.data.error}`
                  : "Connected to the Telegram API and ready to send messages."
                : "The bot token is not configured on the backend. No actions will succeed until it is."}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-foreground">Broadcast to all users</h2>
          </div>
          <Textarea
            className="mt-4"
            rows={4}
            value={broadcastText}
            onChange={(event) => setBroadcastText(event.target.value)}
            placeholder="Message everyone subscribed to the bot…"
          />
          <Button
            className="mt-3"
            disabled={!broadcastText.trim() || !status.data?.configured}
            loading={broadcast.isPending}
            onClick={() => broadcast.mutate(broadcastText, { onSuccess: () => setBroadcastText("") })}
          >
            Send broadcast
          </Button>
          {broadcast.isError && (
            <p className="mt-2 text-sm text-danger-600">Broadcast failed. The bot may not be configured.</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Send className="size-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-foreground">Direct message</h2>
          </div>
          <div className="mt-4 space-y-4">
            <FormField label="User ID">
              <Input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="Telegram user id" />
            </FormField>
            <FormField label="Message">
              <Textarea
                rows={2}
                value={userMessage}
                onChange={(event) => setUserMessage(event.target.value)}
                placeholder="Message content…"
              />
            </FormField>
          </div>
          <Button
            className="mt-3"
            variant="secondary"
            disabled={!userId.trim() || !userMessage.trim() || !status.data?.configured}
            loading={sendUser.isPending}
            onClick={() => sendUser.mutate({ userId: userId.trim(), message: userMessage }, { onSuccess: () => setUserMessage("") })}
          >
            Send message
          </Button>
          {sendUser.isError && (
            <p className="mt-2 text-sm text-danger-600">Couldn&rsquo;t send the message. Check the user id and bot status.</p>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <SendHorizonal className="size-4 text-primary-600" />
            <h2 className="text-sm font-semibold text-foreground">Send job alert</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Pushes a formatted job notification to a single Telegram user by backend user id.
          </p>
          <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-2">
            <FormField label="User ID">
              <Input value={alertUserId} onChange={(event) => setAlertUserId(event.target.value)} placeholder="Backend user id" />
            </FormField>
            <FormField label="Job ID">
              <Input value={alertJobId} onChange={(event) => setAlertJobId(event.target.value)} placeholder="Job id" />
            </FormField>
          </div>
          <Button
            className="mt-4"
            variant="secondary"
            disabled={!alertUserId.trim() || !alertJobId.trim() || !status.data?.configured}
            loading={sendAlert.isPending}
            onClick={() => sendAlert.mutate({ userId: alertUserId.trim(), jobId: alertJobId.trim() })}
          >
            Send job alert
          </Button>
          {sendAlert.isError && (
            <p className="mt-2 text-sm text-danger-600">Couldn&rsquo;t send the job alert. Check the ids and bot status.</p>
          )}
        </Card>
      </div>
    </div>
  );
}