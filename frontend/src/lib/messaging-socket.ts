"use client";

import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "@/lib/api/auth-storage";
import type { Conversation, Message } from "@/types";

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:5000";

export interface NewMessageEvent {
  message: Message;
  conversationId: string;
}

export interface ConversationCreatedEvent {
  conversation: Conversation;
}

export interface ConversationUpdatedEvent {
  conversation: Conversation;
}

export interface ParticipantRemovedEvent {
  conversationId: string;
  participantId: string;
}

export interface RemovedFromConversationEvent {
  conversationId: string;
}

export interface ConversationDeletedEvent {
  conversationId: string;
}

export interface UserTypingEvent {
  userId: string;
  conversationId: string;
}

let socket: Socket | null = null;

/** Lazily create the app-wide socket tied to the current access token. */
export function getMessagingSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket && socket.connected) return socket;

  const token = getAccessToken();
  if (!token) return null;

  socket = io(WS_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
  });
  return socket;
}

/** Disconnect (used when the user logs out). */
export function disconnectMessagingSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinConversation(socket: Socket, conversationId: string): void {
  socket.emit("join-conversation", { conversationId });
}

export function leaveConversation(socket: Socket, conversationId: string): void {
  socket.emit("leave-conversation", { conversationId });
}

export function emitTyping(socket: Socket, conversationId: string): void {
  socket.emit("typing", { conversationId });
}

export function emitStopTyping(socket: Socket, conversationId: string): void {
  socket.emit("stop-typing", { conversationId });
}