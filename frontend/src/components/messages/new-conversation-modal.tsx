"use client";

import { useState } from "react";

import { Avatar, Button, FormField, Input, Modal, Textarea, useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useCreateDirectConversation, useCreateGroupConversation, useUserSearch, type UserSummary } from "@/hooks/use-messages";

type Mode = "direct" | "group";

interface PeopleSearchResultsProps {
  query: string;
  excludeIds: string[];
  onPick: (person: UserSummary) => void;
}

function PeopleSearchResults({ query, excludeIds, onPick }: PeopleSearchResultsProps) {
  const { data, isPending, isError } = useUserSearch(query, true);
  const needle = query.trim().toLowerCase();

  if (needle.length < 2) {
    return <p className="text-xs text-slate-500">Type at least 2 characters to search.</p>;
  }

  const results = (data?.data ?? []).filter((person) => !excludeIds.includes(person._id));

  return (
    <div className="relative">
      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-popover">
        {isPending && <p className="p-3 text-sm text-slate-500">Searching…</p>}
        {isError && <p className="p-3 text-sm text-slate-500">Couldn&rsquo;t search users.</p>}
        {!isPending && !isError && results.length === 0 && (
          <p className="p-3 text-sm text-slate-500">No one found for &ldquo;{needle}&rdquo;.</p>
        )}
        {results.map((person) => (
          <button
            key={person._id}
            type="button"
            onClick={() => onPick(person)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-primary-50"
          >
            <Avatar src={person.avatar} name={person.name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{person.name}</span>
              <span className="block truncate text-xs text-slate-500">{person.email}</span>
            </span>
            <span className="ml-auto shrink-0 text-xs font-medium capitalize text-slate-400">
              {person.role.replace("_", " ")}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function NewConversationModal({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (conversationId: string) => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createDirect = useCreateDirectConversation();
  const createGroup = useCreateGroupConversation();

  const [mode, setMode] = useState<Mode>("direct");
  const [directQuery, setDirectQuery] = useState("");
  const [directSelected, setDirectSelected] = useState<UserSummary | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [groupPicked, setGroupPicked] = useState<UserSummary[]>([]);
  const [participants, setParticipants] = useState("");
  const [avatar, setAvatar] = useState("");

  const reset = () => {
    setMode("direct");
    setDirectQuery("");
    setDirectSelected(null);
    setGroupName("");
    setGroupQuery("");
    setGroupPicked([]);
    setParticipants("");
    setAvatar("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const excludeIds = [user?._id ?? "", ...groupPicked.map((person) => person._id)];

  const submit = () => {
    if (mode === "direct") {
      if (!directSelected) {
        toast("error", "Search for and pick a person to message");
        return;
      }
      createDirect.mutate(directSelected._id, {
        onSuccess: close,
      });
      return;
    }

    const ids = participants
      .split(/[\n,]/)
      .map((id) => id.trim())
      .filter(Boolean)
      .filter((id) => id !== user?._id);

    if (!groupName.trim()) {
      toast("error", "Give the group a name");
      return;
    }
    if (ids.length < 2) {
      toast("error", "At least 2 other participant IDs are required");
      return;
    }
createGroup.mutate(
        {
          name: groupName.trim(),
          participantIds: ids,
          avatar: avatar.trim() || undefined,
        },
        {
          onSuccess: (result) => {
            close();
            onStarted(result.conversation._id);
          },
        },
      );
  };

  const addGroupParticipant = (person: UserSummary) => {
    if (groupPicked.some((picked) => picked._id === person._id)) return;
    setGroupPicked((prev) => [...prev, person]);
    setParticipants((prev) => (prev.trim() ? `${prev.trim()}\n${person._id}` : person._id));
    setGroupQuery("");
  };

  const removeGroupParticipant = (personId: string) => {
    setGroupPicked((prev) => prev.filter((person) => person._id !== personId));
    setParticipants((prev) =>
      prev
        .split(/[\n,]/)
        .map((id) => id.trim())
        .filter((id) => id && id !== personId)
        .join("\n"),
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
          directSelected ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3">
              <Avatar src={directSelected.avatar} name={directSelected.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{directSelected.name}</p>
                <p className="truncate text-xs text-slate-500">{directSelected.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDirectSelected(null);
                  setDirectQuery("");
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <>
              <FormField
                label="Find a person"
                htmlFor="new-user-search"
                required
                hint="Search by name or email. The person must already have an account."
              >
                <Input
                  id="new-user-search"
                  value={directQuery}
                  onChange={(event) => setDirectQuery(event.target.value)}
                  placeholder="Type a name or email…"
                />
              </FormField>
              <div className="-mt-1">
                <PeopleSearchResults
                  query={directQuery}
                  excludeIds={excludeIds}
                  onPick={(person) => {
                    if (createDirect.isPending) return;
                    setDirectSelected(person);
                    setDirectQuery("");
                    createDirect.mutate(person._id, {
                      onSuccess: (result) => {
                        close();
                        onStarted(result.conversation._id);
                      },
                    });
                  }}
                />
              </div>
            </>
          )
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
              label="Add people"
              htmlFor="new-group-search"
              hint="Search by name or email and pick them below."
            >
              <Input
                id="new-group-search"
                value={groupQuery}
                onChange={(event) => setGroupQuery(event.target.value)}
                placeholder="Type a name or email…"
              />
            </FormField>
            <div className="-mt-1">
              <PeopleSearchResults query={groupQuery} excludeIds={excludeIds} onPick={addGroupParticipant} />
            </div>

            {groupPicked.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {groupPicked.map((person) => (
                  <span
                    key={person._id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 py-1 pl-1 pr-2 text-xs font-medium text-primary-700"
                  >
                    <Avatar src={person.avatar} name={person.name} size="xs" />
                    {person.name}
                    <button
                      type="button"
                      aria-label={`Remove ${person.name}`}
                      onClick={() => removeGroupParticipant(person._id)}
                      className="text-primary-700 transition-colors hover:text-danger-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

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
                placeholder="User IDs fill in automatically as you pick people — you can also paste them here."
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