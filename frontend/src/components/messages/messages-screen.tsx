"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, MessageSquarePlus, Paperclip, Search, Send, Settings2 } from "lucide-react";

import { Avatar, Button, EmptyState, Input, Skeleton, Spinner, Textarea, useToast } from "@/components/ui";
import { ErrorState } from "@/components/ui/error-state";
import { useAuth } from "@/hooks/use-auth";
import {
  useConversation,
  useConversations,
  useDeleteMessage,
  useEditMessage,
  useMarkConversationRead,
  useMessageThread,
  useMessagingSocket,
  useMessagingSocketLifecycle,
  useSendMessage,
  useTypingEmitter,
  useUploadMessageAttachment,
} from "@/hooks/use-messages";
import { cn } from "@/lib/cn";
import { formatClock, timeAgo } from "@/lib/format";
import type { Conversation, Message } from "@/types";
import { NewConversationModal } from "@/components/messages/new-conversation-modal";

const toSenderId = (
  id: string | { _id: string } | null | undefined,
): string | undefined =>
  id && typeof id === "object" ? id._id : (id as string | undefined);

function authorOf(message: Message): { name: string; avatar?: string | null } | null {
  const sender = message.senderId;
  if (sender && typeof sender === "object") {
    return { name: sender.name ?? "Unknown", avatar: sender.avatar };
  }
  return null;
}

function MessageBubble({
  message,
  mine,
  onEdit,
  onDelete,
}: {
  message: Message;
  mine: boolean;
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
}) {
  const author = authorOf(message);
  const deleted = message.isDeleted;
  return (
    <div className={cn("flex gap-2.5", mine ? "justify-end" : "justify-start")}>
      {!mine && <Avatar src={author?.avatar} name={author?.name ?? "Unknown"} size="sm" />}
      <div className={cn("min-w-0 max-w-[78%]", mine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
            mine
              ? "rounded-br-md bg-primary-600 text-white"
              : "rounded-bl-md border border-border bg-surface text-foreground",
          )}
        >
          {deleted ? (
            <span className={cn("italic", mine ? "text-white/70" : "text-slate-400")}>
              This message was deleted
            </span>
          ) : (
            <span className="whitespace-pre-wrap break-words">{message.content}</span>
          )}

          {!deleted && message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {message.attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                    mine
                      ? "border-white/25 text-white hover:bg-white/10"
                      : "border-border-strong text-primary-700 hover:bg-primary-50",
                  )}
                >
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="truncate">{attachment.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className={cn("mt-1 flex items-center gap-2 px-1", mine ? "justify-end" : "justify-start")}>
          <span className="text-[11px] text-slate-400">{formatClock(message.createdAt)}</span>
          {message.isEdited && !deleted && (
            <span className="text-[11px] text-slate-400">edited</span>
          )}
          {mine && !deleted && (
            <span className="text-[11px] text-slate-400">
              {message.isRead ? "Read" : "Delivered"}
            </span>
          )}
          {mine && !deleted && (
            <span className="flex items-center gap-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs"
                onClick={() => onEdit(message)}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs hover:text-danger-600"
                onClick={() => onDelete(message)}
              >
                Delete
              </Button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Thread({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const markRead = useMarkConversationRead();
  const send = useSendMessage();
  const edit = useEditMessage();
  const remove = useDeleteMessage();
  const upload = useUploadMessageAttachment();

  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<Message | null>(null);
  const { data: thread, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, refetch } =
    useMessageThread(conversation._id);

  const { typing } = useMessagingSocket(conversation._id);
  const { fireTyping } = useTypingEmitter(conversation._id);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = (thread?.pages ?? []).slice().reverse().flat();
  const newestId = messages[messages.length - 1]?._id;

  useEffect(() => {
    if (conversation._id) markRead.mutate(conversation._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation._id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [newestId, conversation._id]);

  const submit = () => {
    const content = (editing ? editing.content : draft).trim();
    if (!content) return;

    if (editing) {
      edit.mutate({ id: editing._id, content }, { onSuccess: () => setEditing(null) });
      return;
    }

    send.mutate(
      { conversationId: conversation._id, input: { content } },
      {
        onSuccess: () => setDraft(""),
        onError: (error) => {
          toast("error", "Could not send message", error instanceof Error ? error.message : undefined);
        },
      },
    );
  };

  const handleFile = (file: File) => {
    upload.mutate(
      { conversationId: conversation._id, file },
      {
        onError: (error) => {
          toast("error", "Attachment failed to upload", error instanceof Error ? error.message : undefined);
        },
      },
    );
  };

  const canSend = (editing ? editing.content : draft).trim().length > 0;
  const anyTyping = typing.length > 0;
  const other = conversation.otherParticipants?.[0];
  const headerName = conversation.displayName ?? conversation.groupName ?? other?.name ?? "Conversation";
  const headerAvatar = conversation.displayAvatar ?? (conversation.isGroup ? conversation.groupAvatar : other?.avatar) ?? null;
  const subtitle = conversation.isGroup
    ? `${conversation.participants?.length ?? 0} participants`
    : other?.name ?? "Direct message";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack} aria-label="Back to conversations">
          <ChevronLeft className="size-5" />
        </Button>
        <Avatar src={headerAvatar} name={headerName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{headerName}</p>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
        <Link href={`/messages/${conversation._id}`}>
          <Button variant="ghost" size="icon" aria-label="Conversation settings">
            <Settings2 className="size-4" />
          </Button>
        </Link>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {isPending && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="ml-auto h-12 w-1/2" />
            <Skeleton className="h-12 w-2/3" />
          </div>
        )}

        {!isPending && hasNextPage && (
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              loading={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              Load earlier messages
            </Button>
          </div>
        )}

        {!isPending && messages.length === 0 && (
          <div className="pt-10">
            <EmptyState
              title="No messages yet"
              description="Say hello — this is the start of your conversation."
            />
          </div>
        )}

        {!isPending && isError && (
          <ErrorState
            title="Couldn't load messages"
            message="We couldn't fetch this conversation's messages."
            onRetry={() => void refetch()}
            className="py-8"
          />
        )}

        {messages.map((message) => (
          <div key={message._id} className="group flex flex-col">
            <MessageBubble
              message={message}
              mine={toSenderId(message.senderId) === user?._id}
              onEdit={setEditing}
              onDelete={(target) => remove.mutate(target._id)}
            />
          </div>
        ))}

        {anyTyping && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="size-3.5" aria-label="Typing" />
            <span className="italic">typing…</span>
          </div>
        )}
      </div>

      {editing && (
        <div className="flex items-center gap-2 border-t border-border bg-primary-50 px-4 py-2 text-sm text-primary-700">
          <span className="truncate">
            Editing message from <span className="font-medium">{formatClock(editing.createdAt)}</span>
          </span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="border-t border-border bg-surface p-3 sm:px-4">
        <div className="flex items-end gap-2">
          <label htmlFor="message-attachment" className="cursor-pointer">
            <Button variant="ghost" size="icon" aria-label="Attach a file" type="button" disabled={upload.isPending}>
              {upload.isPending ? <Spinner className="size-4" /> : <Paperclip className="size-4" />}
            </Button>
            <input
              id="message-attachment"
              type="file"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = "";
              }}
            />
          </label>
          <Textarea
            rows={1}
            aria-label={editing ? "Edit message" : "Message"}
            value={editing ? editing.content : draft}
            onChange={(event) => {
              if (editing) setEditing({ ...editing, content: event.target.value });
              else {
                setDraft(event.target.value);
                fireTyping();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={editing ? "Edit your message…" : "Write a message…"}
            className="max-h-32 min-h-10 flex-1 resize-none"
          />
          <Button
            size="icon"
            onClick={submit}
            loading={send.isPending || edit.isPending}
            disabled={!canSend}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  unread,
  onOpen,
}: {
  conversation: Conversation;
  active: boolean;
  unread: number;
  onOpen: () => void;
}) {
  const lastMessage = conversation.lastMessage;
  const preview =
    typeof lastMessage === "object" && lastMessage
      ? lastMessage.isDeleted
        ? "Deleted message"
        : lastMessage.content
      : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted",
        active && "bg-primary-50/70 hover:bg-primary-50/70",
      )}
    >
      <Avatar
        src={conversation.displayAvatar ?? null}
        name={conversation.displayName ?? conversation.groupName ?? "Conversation"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              unread > 0 ? "font-semibold text-foreground" : "font-medium text-foreground",
            )}
          >
            {conversation.displayName ?? conversation.groupName ?? "Conversation"}
          </p>
          {conversation.lastMessageAt && (
            <span className="shrink-0 text-[11px] text-slate-400">
              {timeAgo(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={cn("truncate text-xs", unread > 0 ? "text-foreground" : "text-slate-500")}>
            {preview ?? "No messages yet"}
          </p>
          {unread > 0 && (
            <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent-600 px-1.5 text-[11px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function ConversationList({
  onOpen,
  activeId,
  onCreate,
}: {
  onOpen: (id: string) => void;
  activeId: string | null;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const conversations = useConversations({ includeArchived: showArchived }, true);
  const rows = conversations.data?.data ?? [];

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((conv) =>
        (conv.displayName ?? conv.groupName ?? "").toLowerCase().includes(needle),
      )
    : rows;

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border">
      <div className="border-b border-border p-3">
        <Button fullWidth onClick={onCreate}>
          <MessageSquarePlus className="size-4" />
          New conversation
        </Button>
      </div>

      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Search conversations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="pl-9"
          />
        </div>
      </div>

      {conversations.isPending && (
        <div className="space-y-2 p-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {conversations.isError && (
        <div className="p-4">
          <ErrorState
            title="Couldn't load conversations"
            message="We couldn't fetch your conversations."
            onRetry={() => conversations.refetch()}
            className="py-6"
          />
        </div>
      )}

      {!conversations.isPending && !conversations.isError && filtered.length === 0 && (
        <div className="p-6">
          <EmptyState
            title={query ? "No matches" : "No conversations yet"}
            description={query ? "Try a different search." : "Start one with an employer or recruiter."}
          />
        </div>
      )}

      {!conversations.isPending && filtered.length > 0 && (
        <div className="flex-1 divide-y divide-border overflow-y-auto">
          {filtered.map((conv) => (
            <ConversationRow
              key={conv._id}
              conversation={conv}
              active={conv._id === activeId}
              unread={conv.unreadCount ?? 0}
              onOpen={() => onOpen(conv._id)}
            />
          ))}
        </div>
      )}

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors",
            showArchived ? "bg-primary-50 text-primary-700" : "text-slate-500 hover:bg-surface-muted",
          )}
        >
          {showArchived ? "Hide archived conversations" : "Show archived conversations"}
        </button>
      </div>
    </div>
  );
}

export function MessagesScreen() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const mobileDetailOpen = Boolean(activeId);

  useMessagingSocketLifecycle();
  const { data: activeResult } = useConversation(activeId ?? undefined);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[480px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className={cn("w-full lg:block lg:w-[320px] lg:shrink-0", mobileDetailOpen && "hidden")}>
        <ConversationList onOpen={setActiveId} activeId={activeId} onCreate={() => setCreateOpen(true)} />
      </div>

      <div className={cn("min-w-0 flex-1 flex-col", mobileDetailOpen ? "flex" : "hidden lg:flex")}>
        {!activeId || !activeResult?.conversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-600">
              <Mail className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Pick a conversation</p>
              <p className="text-sm text-slate-500">Select a thread from the left to start chatting.</p>
            </div>
          </div>
        ) : (
          <Thread conversation={activeResult.conversation} onBack={() => setActiveId(null)} />
        )}
      </div>

      <NewConversationModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}