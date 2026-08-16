"use client";

import { useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  addConversationParticipants,
  archiveConversation,
  createDirectConversation,
  createGroupConversation,
  deleteConversation,
  deleteMessage,
  editMessage,
  getConversation,
  getConversations,
  getMessages,
  leaveConversation,
  markConversationRead,
  markMessageRead,
  removeConversationParticipant,
  searchMessages,
  sendMessage,
  unarchiveConversation,
  updateConversation,
  uploadMessageAttachment,
  type ConversationQueryParams,
  type ConversationUpdateInput,
  type GroupConversationInput,
  type MessagesQueryParams,
  type SendMessageInput,
} from "@/lib/api/messages";
import {
  disconnectMessagingSocket,
  emitStopTyping,
  emitTyping,
  getMessagingSocket,
  joinConversation,
  leaveConversation as leaveConversationRoom,
  type ConversationCreatedEvent,
  type ConversationDeletedEvent,
  type ConversationUpdatedEvent,
  type NewMessageEvent,
  type ParticipantRemovedEvent,
  type RemovedFromConversationEvent,
  type UserTypingEvent,
} from "@/lib/messaging-socket";
import { searchUsers, type UserSummary } from "@/lib/api/users";
import type { Message } from "@/types";

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export function useConversations(
  params: ConversationQueryParams = {},
  enabled = true,
) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["messages", "conversations", params],
    queryFn: () => getConversations(params),
    enabled: enabled && status === "authenticated",
    placeholderData: keepPreviousData,
  });
}

/** Sums unread counts across the conversation list for nav badges. */
export function useMessagingUnread() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["messages", "unread"],
    queryFn: async () => {
      const page = await getConversations({ limit: 100, sort: "-lastMessageAt" });
      const total = page.data.reduce((sum, conv) => sum + (conv.unreadCount ?? 0), 0);
      return { total, conversations: page.data };
    },
    enabled: status === "authenticated",
    refetchInterval: 30_000,
  });
}

export function useConversation(id: string | undefined) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["messages", "conversation", id],
    queryFn: () => getConversation(id as string),
    enabled: status === "authenticated" && Boolean(id),
  });
}

const THREAD_LIMIT = 30;

export function useMessageThread(conversationId: string | undefined) {
  const { status } = useAuth();
  return useInfiniteQuery({
    queryKey: ["messages", "thread", conversationId],
    queryFn: ({ pageParam }) =>
      getMessages(conversationId as string, {
        limit: THREAD_LIMIT,
        before: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.hasNext) return undefined;
      const oldest = lastPage.data[0];
      return oldest ? oldest.createdAt : undefined;
    },
    enabled: status === "authenticated" && Boolean(conversationId),
    placeholderData: keepPreviousData,
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => page.data),
    }),
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

function invalidateConversationQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
  queryClient.invalidateQueries({ queryKey: ["messages", "unread"] });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (userId: string) => createDirectConversation(userId),
    onSuccess: (result) => {
      invalidateConversationQueries(queryClient);
      toast("success", "Conversation started");
      return result;
    },
    onError: (error) => {
      toast("error", "Could not start conversation", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useCreateGroupConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: GroupConversationInput) => createGroupConversation(input),
    onSuccess: () => {
      invalidateConversationQueries(queryClient);
      toast("success", "Group conversation created");
    },
    onError: (error) => {
      toast("error", "Could not create group", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ConversationUpdateInput }) =>
      updateConversation(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
      invalidateConversationQueries(queryClient);
      toast("success", "Conversation updated");
    },
    onError: (error) => {
      toast("error", "Could not update conversation", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useAddParticipants() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, participantIds }: { id: string; participantIds: string[] }) =>
      addConversationParticipants(id, participantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
      invalidateConversationQueries(queryClient);
      toast("success", "Participants added");
    },
    onError: (error) => {
      toast("error", "Could not add participants", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, participantId }: { id: string; participantId: string }) =>
      removeConversationParticipant(id, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation"] });
      invalidateConversationQueries(queryClient);
      toast("success", "Participant removed");
    },
    onError: (error) => {
      toast("error", "Could not remove participant", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useLeaveConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => leaveConversation(id),
    onSuccess: () => {
      invalidateConversationQueries(queryClient);
      toast("success", "You left the conversation");
    },
    onError: (error) => {
      toast("error", "Could not leave conversation", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) =>
      archive ? archiveConversation(id) : unarchiveConversation(id),
    onSuccess: (_data, variables) => {
      invalidateConversationQueries(queryClient);
      toast("success", variables.archive ? "Conversation archived" : "Conversation unarchived");
    },
    onError: (error) => {
      toast("error", "Could not archive conversation", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => {
      invalidateConversationQueries(queryClient);
      toast("success", "Conversation deleted");
    },
    onError: (error) => {
      toast("error", "Could not delete conversation", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      input,
    }: {
      conversationId: string;
      input: SendMessageInput;
    }) => sendMessage(conversationId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "thread", variables.conversationId] });
      invalidateConversationQueries(queryClient);
    },
  });
}

export function useMarkMessageRead() {
  return useMutation({
    mutationFn: (messageId: string) => markMessageRead(messageId),
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "unread"] });
      invalidateConversationQueries(queryClient);

      const socket = getMessagingSocket();
      socket?.emit("subscribe", { channel: `conversation:${conversationId}` });
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => editMessage(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "thread"] });
      toast("success", "Message updated");
    },
    onError: (error) => {
      toast("error", "Could not update message", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "thread"] });
      invalidateConversationQueries(queryClient);
    },
  });
}

export function useMessageSearch(q: string, enabled = false) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["messages", "search", q],
    queryFn: () => searchMessages(q, { limit: 20 }),
    enabled: enabled && status === "authenticated" && q.trim().length >= 2,
  });
}

/** Debounced search for active users (for starting conversations). */
export function useUserSearch(query: string, enabled = false) {
  const { status } = useAuth();
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["users", "search", trimmed],
    queryFn: () => searchUsers(trimmed, { limit: 8 }),
    enabled: enabled && status === "authenticated" && trimmed.length >= 2,
    placeholderData: keepPreviousData,
  });
}

export type { UserSummary };

/* ------------------------------------------------------------------ */
/* Socket wiring                                                       */
/* ------------------------------------------------------------------ */

function appendMessageToThreadCache(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: Message,
) {
  queryClient.setQueryData<{
    pages: Message[][];
    pageParams: (string | undefined)[];
  }>(["messages", "thread", conversationId], (old) => {
    if (!old) return old;
    const head = old.pages[0];
    if (!head || head.some((msg) => msg._id === message._id)) return old;
    return {
      ...old,
      pages: [[message, ...head], ...old.pages.slice(1)],
    };
  });
}

/**
 * Connects the global socket while authenticated and wires the events the
 * inbox cares about: live messages, conversation lifecycle, typing.
 */
export function useMessagingSocket(activeConversationId?: string) {
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const activeRef = useRef(activeConversationId);
  const [typing, setTyping] = useState<string[]>([]);

  useEffect(() => {
    activeRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const socket = getMessagingSocket();
    if (status !== "authenticated" || !socket) return;

    const onNewMessage = ({ message, conversationId }: NewMessageEvent) => {
      appendMessageToThreadCache(queryClient, conversationId, message);
      if (activeRef.current !== conversationId) {
        queryClient.setQueryData(["messages", "unread"], (old: { total: number; conversations: unknown[] } | undefined) =>
          old ? { ...old, total: old.total + 1 } : old,
        );
        queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      }
    };

    const onConversationCreated = ({ conversation }: ConversationCreatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread"] });
      void conversation;
    };

    const onConversationUpdated = ({ conversation }: ConversationUpdatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation", conversation._id] });
      invalidateConversationQueries(queryClient);
    };

    const onParticipantsAdded = () => {
      invalidateConversationQueries(queryClient);
    };

    const onParticipantRemoved = ({ conversationId }: ParticipantRemovedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["messages", "conversation", conversationId] });
      invalidateConversationQueries(queryClient);
    };

    const onConversationDeleted = ({ conversationId }: ConversationDeletedEvent) => {
      queryClient.removeQueries({ queryKey: ["messages", "conversation", conversationId] });
      queryClient.removeQueries({ queryKey: ["messages", "thread", conversationId] });
      invalidateConversationQueries(queryClient);
    };

    const onRemovedFromConversation = ({ conversationId }: RemovedFromConversationEvent) => {
      queryClient.removeQueries({ queryKey: ["messages", "conversation", conversationId] });
      queryClient.removeQueries({ queryKey: ["messages", "thread", conversationId] });
      invalidateConversationQueries(queryClient);
    };

    const onUserTyping = ({ conversationId, userId }: UserTypingEvent) => {
      if (activeRef.current === conversationId) {
        setTyping((list) => (list.includes(userId) ? list : [...list, userId]));
      }
    };

    const onUserStopTyping = ({ conversationId, userId }: UserTypingEvent) => {
      if (activeRef.current === conversationId) {
        setTyping((list) => list.filter((id) => id !== userId));
      }
    };

    socket.on("new-message", onNewMessage);
    socket.on("conversation-created", onConversationCreated);
    socket.on("conversation-updated", onConversationUpdated);
    socket.on("participants-added", onParticipantsAdded);
    socket.on("participant-removed", onParticipantRemoved);
    socket.on("conversation-deleted", onConversationDeleted);
    socket.on("removed-from-conversation", onRemovedFromConversation);
    socket.on("user-typing", onUserTyping);
    socket.on("user-stop-typing", onUserStopTyping);

    return () => {
      socket.off("new-message", onNewMessage);
      socket.off("conversation-created", onConversationCreated);
      socket.off("conversation-updated", onConversationUpdated);
      socket.off("participants-added", onParticipantsAdded);
      socket.off("participant-removed", onParticipantRemoved);
      socket.off("conversation-deleted", onConversationDeleted);
      socket.off("removed-from-conversation", onRemovedFromConversation);
      socket.off("user-typing", onUserTyping);
      socket.off("user-stop-typing", onUserStopTyping);
    };
  }, [status, queryClient]);

  // Presence in the active conversation room (for typing/read sharing).
  useEffect(() => {
    if (status !== "authenticated") return;
    const socket = getMessagingSocket();
    if (!socket || !activeConversationId) return;
    joinConversation(socket, activeConversationId);
    return () => {
      leaveConversationRoom(socket, activeConversationId);
    };
  }, [status, activeConversationId]);

  return { typing };
}

/** Wire typing indicators: emit typing on input, throttle stop. */
export function useTypingEmitter(conversationId: string | undefined) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireTyping = () => {
    if (!conversationId) return;
    const socket = getMessagingSocket();
    if (!socket) return;
    emitTyping(socket, conversationId);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => emitStopTyping(socket, conversationId), 1500);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      const socket = getMessagingSocket();
      if (socket && conversationId) emitStopTyping(socket, conversationId);
    };
  }, [conversationId]);

  return { fireTyping };
}

/** Disconnect the socket on logout. */
export function useMessagingSocketLifecycle() {
  const { status } = useAuth();
  useEffect(() => {
    if (status === "unauthenticated") disconnectMessagingSocket();
  }, [status]);
}

/** Upload an attachment to a conversation. */
export function useUploadMessageAttachment() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ conversationId, file }: { conversationId: string; file: File }) =>
      uploadMessageAttachment(conversationId, file),
    onError: (error) => {
      toast("error", "Upload failed", error instanceof Error ? error.message : undefined);
    },
  });
}

export type { MessagesQueryParams };