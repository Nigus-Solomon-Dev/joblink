import type { Conversation } from "@/types";

/** Normalize a possibly-populated id field to its string value. */
export function toParticipantId(
  id: string | { _id: string } | null | undefined,
): string | undefined {
  if (!id) return undefined;
  return typeof id === "object" ? id._id : id;
}

/** Best-effort display name for a conversation. */
export function displayNameOf(conversation: Conversation): string {
  return (
    conversation.displayName ??
    conversation.groupName ??
    conversation.otherParticipants?.[0]?.name ??
    "Conversation"
  );
}

/** Best-effort avatar for a conversation. */
export function avatarOf(conversation: Conversation): string | null {
  if (conversation.displayAvatar) return conversation.displayAvatar;
  if (conversation.isGroup) return conversation.groupAvatar ?? null;
  return conversation.otherParticipants?.[0]?.avatar ?? null;
}