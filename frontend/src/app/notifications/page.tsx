import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/guards";
import { NotificationsScreen } from "@/components/seeker/notifications-screen";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsRoute() {
  return (
    <RequireAuth>
      <div className="container-site py-10">
        <NotificationsScreen />
      </div>
    </RequireAuth>
  );
}