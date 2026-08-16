import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/guards";
import { MessagesScreen } from "@/components/messages/messages-screen";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesRoute() {
  return (
    <RequireAuth>
      <div className="container-site py-6 sm:py-10">
        <MessagesScreen />
      </div>
    </RequireAuth>
  );
}