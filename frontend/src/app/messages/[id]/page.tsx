import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/guards";
import { ConversationSettings } from "@/components/messages/conversation-settings";

export const metadata: Metadata = { title: "Conversation Settings" };

export default async function ConversationSettingsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireAuth>
      <div className="container-site mx-auto max-w-3xl py-10">
        <ConversationSettings conversationId={id} />
      </div>
    </RequireAuth>
  );
}