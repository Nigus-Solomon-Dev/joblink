"use client";

import { useState } from "react";

import { Button, FormField, Input, Modal, Textarea, useToast } from "@/components/ui";
import { useCreateDirectConversation, useCreateGroupConversation } from "@/hooks/use-messages";

type Mode = "direct" | "group";

export function NewConversationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const createDirect = useCreateDirectConversation();
  const createGroup = useCreateGroupConversation();

  const [mode, setMode] = useState<Mode>("direct");
  const [userId, setUserId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState("");
  const [avatar, setAvatar] = useState("");

  const reset = () => {
    setMode("direct");
    setUserId("");
    setGroupName("");
    setParticipants("");
    setAvatar("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (mode === "direct") {
      if (!userId.trim()) {
        toast("error", "Enter the user ID to message");
        return;
      }
      createDirect.mutate(userId.trim(), {
        onSuccess: close,
      });
      return;
    }

    const ids = participants
      .split(/[\n,]/)
      .map((id) => id.trim())
      .filter(Boolean);

    if (!groupName.trim()) {
      toast("error", "Give the group a name");
      return;
    }
    if (ids.length < 2) {
      toast("error", "At least 2 participant IDs are required");
      return;
    }
    createGroup.mutate(
      {
        name: groupName.trim(),
        participantIds: ids,
        avatar: avatar.trim() || undefined,
      },
      { onSuccess: close },
    );
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="New conversation"
      description="Start a direct chat or create a group."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button loading={createDirect.isPending || createGroup.isPending} onClick={submit}>
            {mode === "direct" ? "Start chat" : "Create group"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="flex gap-1 rounded-lg border border-border bg-surface-muted p-1">
          {(["direct", "group"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={
                mode === option
                  ? "flex-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
                  : "flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-surface"
              }
            >
              {option === "direct" ? "Direct" : "Group"}
            </button>
          ))}
        </div>

        {mode === "direct" ? (
          <FormField
            label="User ID"
            htmlFor="new-user-id"
            required
            hint="The person you want to chat with must already have an account."
          >
            <Input
              id="new-user-id"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="64-char user id"
            />
          </FormField>
        ) : (
          <>
            <FormField label="Group name" htmlFor="new-group-name" required>
              <Input
                id="new-group-name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="e.g. Hiring team — frontend"
              />
            </FormField>
            <FormField
              label="Participant IDs"
              htmlFor="new-participants"
              required
              hint="One user ID per line, at least 2. The group needs at least one other member besides you."
            >
              <Textarea
                id="new-participants"
                rows={3}
                value={participants}
                onChange={(event) => setParticipants(event.target.value)}
                placeholder="user id one&#10;user id two"
              />
            </FormField>
            <FormField label="Group avatar URL" htmlFor="new-group-avatar" hint="Optional.">
              <Input
                id="new-group-avatar"
                type="url"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="https://…"
              />
            </FormField>
          </>
        )}
      </div>
    </Modal>
  );
}