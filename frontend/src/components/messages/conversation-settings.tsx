"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button, FormField, Input, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  useAddParticipants,
  useArchiveConversation,
  useConversation,
  useDeleteConversation,
  useLeaveConversation,
  useRemoveParticipant,
  useUpdateConversation,
} from "@/hooks/use-messages";
import { cn } from "@/lib/cn";
import { toParticipantId, displayNameOf, avatarOf } from "@/lib/message-helpers";

function ParticipantAvatar({ name, avatar }: { name?: string; avatar?: string | null }) {
  return <Avatar src={avatar ?? null} name={name ?? "?"} size="sm" />;
}

export function ConversationSettings({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data, isPending } = useConversation(conversationId);
  const update = useUpdateConversation();
  const add = useAddParticipants();
  const remove = useRemoveParticipant();
  const archive = useArchiveConversation();
  const leave = useLeaveConversation();
  const del = useDeleteConversation();

  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("");
  const [newIds, setNewIds] = useState("");

  const conversation = data?.conversation;

  if (isPending || !conversation) {
    return (
      <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Avatar size="sm" />
            <div className="h-3 flex-1 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    );
  }

  const isGroup = conversation.isGroup;
  const isAdmin = isGroup && toParticipantId(conversation.groupAdmin) === user?._id;
  const otherParticipants = conversation.otherParticipants ?? [];

  const rename = () => {
    if (!isGroup || !isAdmin) return;
    const input: { groupName?: string; groupAvatar?: string } = {};
    if (groupName.trim()) input.groupName = groupName.trim();
    if (groupAvatar.trim()) input.groupAvatar = groupAvatar.trim();
    if (Object.keys(input).length === 0) return;
    update.mutate({ id: conversation._id, input }, { onSuccess: () => { setGroupName(""); setGroupAvatar(""); } });
  };

  const addParticipants = () => {
    const ids = newIds
      .split(/[\n,]/)
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      toast("error", "Enter at least one user ID");
      return;
    }
    add.mutate({ id: conversation._id, participantIds: ids }, { onSuccess: () => setNewIds("") });
  };

  const handleLeave = () => {
    leave.mutate(conversation._id, { onSuccess: () => router.push("/messages") });
  };

  const handleDelete = () => {
    del.mutate(conversation._id, { onSuccess: () => router.push("/messages") });
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Messaging</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Conversation settings</h1>
        <p className="mt-1 text-sm text-slate-600">{displayNameOf(conversation)}</p>
      </header>

      <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
        <section className="px-5 py-4">
          <div className="flex items-center gap-4">
            <Avatar src={avatarOf(conversation)} name={displayNameOf(conversation)} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{displayNameOf(conversation)}</p>
              <p className="text-xs text-slate-500">
                {isGroup ? "Group conversation" : "Direct message"}
                {isGroup && isAdmin && " · you are the admin"}
              </p>
            </div>
          </div>

          {isGroup && isAdmin && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FormField label="Group name" htmlFor="settings-name">
                <Input
                  id="settings-name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder={conversation.groupName}
                />
              </FormField>
              <FormField label="Group avatar URL" htmlFor="settings-avatar">
                <Input
                  id="settings-avatar"
                  type="url"
                  value={groupAvatar}
                  onChange={(event) => setGroupAvatar(event.target.value)}
                  placeholder="https://…"
                />
              </FormField>
              <div className="sm:col-span-2">
                <Button size="sm" loading={update.isPending} onClick={rename}>
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Participants</p>
            <span className="text-xs text-slate-500">{conversation.participants?.length ?? 0} total</span>
          </div>

          {otherParticipants.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">
              This is a direct conversation with {displayNameOf(conversation)}.
            </p>
          )}

          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {otherParticipants.map((participant) => {
              const participantId = toParticipantId(participant._id);
              const isMe = participantId === user?._id;
              const canRemove = Boolean(isAdmin) && !isMe;
              return (
                <li key={participantId ?? participant.name ?? participant._id} className="flex items-center gap-3 px-4 py-3">
                  <ParticipantAvatar name={participant.name ?? "?"} avatar={participant.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {participant.name ?? "Unknown"}{isMe && <span className="ml-1.5 text-xs text-slate-400">(you)</span>}
                    </p>
                    {participant.email && <p className="truncate text-xs text-slate-500">{participant.email}</p>}
                  </div>
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${participant.name}`}
                      onClick={() => remove.mutate({ id: conversation._id, participantId: participantId as string })}
                    >
                      <Trash2 className="size-4 text-danger-600" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          {isAdmin && (
            <div className="mt-4 grid gap-3">
              <FormField label="Add participants" htmlFor="settings-add" hint="One user ID per line.">
                <Input
                  id="settings-add"
                  value={newIds}
                  onChange={(event) => setNewIds(event.target.value)}
                  placeholder="user id one&#10;user id two"
                />
              </FormField>
              <div>
                <Button size="sm" variant="outline" loading={add.isPending} onClick={addParticipants}>
                  Add participants
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="px-5 py-4">
          <p className="text-sm font-semibold text-foreground">Actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {isGroup && !isAdmin && (
              <Button variant="outline" size="sm" loading={leave.isPending} onClick={handleLeave}>
                Leave conversation
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              loading={archive.isPending}
              onClick={() =>
                archive.mutate({
                  id: conversation._id,
                  archive: !conversation.isArchived,
                })
              }
            >
              {conversation.isArchived ? "Unarchive" : "Archive"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              className={cn(isGroup && !isAdmin && "text-opacity-100")}
              disabled={isGroup && !isAdmin}
              title={isGroup && !isAdmin ? "Only the group admin can delete the conversation" : undefined}
              loading={del.isPending}
              onClick={handleDelete}
            >
              Delete conversation
            </Button>
          </div>
          {isGroup && !isAdmin && (
            <p className="mt-2 text-xs text-slate-500">
              You can leave the group instead — deleting it is reserved for the admin.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}