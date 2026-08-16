import type {
  Conversation,
  Message,
  MessageAttachment,
} from "@/types";
import type { Paginated } from "@/types/api";

import { http, unwrap, unwrapPaginated } from "./http";

const conv = (id: string) => `/messages/conversations/${encodeURIComponent(id)}`;

/* ------------------------------------------------------------------ */
/* Conversations                                                       */
/* ------------------------------------------------------------------ */

export interface ConversationQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  includeArchived?: boolean;
}

/** `GET /messages/conversations` */
export async function getConversations(
  params: ConversationQueryParams = {},
): Promise<Paginated<Conversation>> {
  return unwrapPaginated<Conversation>(
    await http.get("/messages/conversations", {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        sort: params.sort || undefined,
        includeArchived: params.includeArchived ? "true" : undefined,
      },
    }),
  );
}

/** `GET /messages/conversations/:id` */
export async function getConversation(
  id: string,
): Promise<{ conversation: Conversation }> {
  return unwrap<{ conversation: Conversation }>(await http.get(conv(id)));
}

/** `POST /messages/conversations/direct` — body `{ userId }`. */
export async function createDirectConversation(
  userId: string,
): Promise<{ conversation: Conversation }> {
  return unwrap<{ conversation: Conversation }>(
    await http.post("/messages/conversations/direct", { userId }),
  );
}

export interface GroupConversationInput {
  name: string;
  participantIds: string[];
  avatar?: string;
}

/** `POST /messages/conversations/group` */
export async function createGroupConversation(
  input: GroupConversationInput,
): Promise<{ conversation: Conversation }> {
  return unwrap<{ conversation: Conversation }>(
    await http.post("/messages/conversations/group", input),
  );
}

export interface ConversationUpdateInput {
  groupName?: string;
  groupAvatar?: string;
}

/** `PATCH /messages/conversations/:id` — group name/avatar (group admin only). */
export async function updateConversation(
  id: string,
  input: ConversationUpdateInput,
): Promise<{ conversation: Conversation }> {
  return unwrap<{ conversation: Conversation }>(
    await http.patch(conv(id), input),
  );
}

/** `POST /messages/conversations/:id/participants` — body `{ participantIds }`. */
export async function addConversationParticipants(
  id: string,
  participantIds: string[],
): Promise<{ conversation: Conversation }> {
  return unwrap<{ conversation: Conversation }>(
    await http.post(`${conv(id)}/participants`, { participantIds }),
  );
}

/** `DELETE /messages/conversations/:id/participants/:participantId` */
export async function removeConversationParticipant(
  id: string,
  participantId: string,
): Promise<{ conversation: Conversation }> {
  return unwrap<{ conversation: Conversation }>(
    await http.delete(`${conv(id)}/participants/${encodeURIComponent(participantId)}`),
  );
}

/** `POST /messages/conversations/:id/leave` */
export async function leaveConversation(id: string): Promise<void> {
  await http.post(`${conv(id)}/leave`);
}

/** `POST /messages/conversations/:id/archive` */
export async function archiveConversation(id: string): Promise<void> {
  await http.post(`${conv(id)}/archive`);
}

/** `POST /messages/conversations/:id/unarchive` */
export async function unarchiveConversation(id: string): Promise<void> {
  await http.post(`${conv(id)}/unarchive`);
}

/** `DELETE /messages/conversations/:id` */
export async function deleteConversation(id: string): Promise<void> {
  await http.delete(conv(id));
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export interface MessagesQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  /** ISO timestamp — return only messages older than this. */
  before?: string;
}

/** `GET /messages/conversations/:conversationId/messages` */
export async function getMessages(
  conversationId: string,
  params: MessagesQueryParams = {},
): Promise<Paginated<Message>> {
  return unwrapPaginated<Message>(
    await http.get(`/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
      params: {
        page: params.page || undefined,
        limit: params.limit || undefined,
        sort: params.sort || undefined,
        before: params.before || undefined,
      },
    }),
  );
}

export interface SendMessageInput {
  content: string;
  attachments?: MessageAttachment[];
}

/** `POST /messages/conversations/:conversationId/messages` */
export async function sendMessage(
  conversationId: string,
  input: SendMessageInput,
): Promise<{ message: Message }> {
  return unwrap<{ message: Message }>(
    await http.post(
      `/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
      input,
    ),
  );
}

/** `GET /messages/messages/:id` (note: bare `/:id` after `/messages`). */
export async function getMessageById(
  id: string,
): Promise<{ message: Message }> {
  return unwrap<{ message: Message }>(await http.get(`/messages/${encodeURIComponent(id)}`));
}

/** `PATCH /messages/messages/:id/read` */
export async function markMessageRead(id: string): Promise<void> {
  await http.patch(`/messages/${encodeURIComponent(id)}/read`);
}

/** `POST /messages/conversations/:conversationId/read` */
export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  await http.post(
    `/messages/conversations/${encodeURIComponent(conversationId)}/read`,
  );
}

/** `PATCH /messages/messages/:id` — edit own message. */
export async function editMessage(
  id: string,
  content: string,
): Promise<{ message: Message }> {
  return unwrap<{ message: Message }>(
    await http.patch(`/messages/${encodeURIComponent(id)}`, { content }),
  );
}

/** `DELETE /messages/messages/:id` — soft-delete own message. */
export async function deleteMessage(id: string): Promise<void> {
  await http.delete(`/messages/${encodeURIComponent(id)}`);
}

/** `GET /messages/messages/search?q=` */
export async function searchMessages(
  q: string,
  params: { page?: number; limit?: number } = {},
): Promise<Paginated<Message>> {
  return unwrapPaginated<Message>(
    await http.get("/messages/search", {
      params: { q, page: params.page || undefined, limit: params.limit || undefined },
    }),
  );
}

/** `POST /messages/conversations/:conversationId/attachments` (multipart field `file`). */
export async function uploadMessageAttachment(
  conversationId: string,
  file: File,
): Promise<{ attachment: MessageAttachment }> {
  const formData = new FormData();
  formData.append("file", file);
  return unwrap<{ attachment: MessageAttachment }>(
    await http.post(
      `/messages/conversations/${encodeURIComponent(conversationId)}/attachments`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    ),
  );
}
