import type { Metadata } from "next";

import { RequireRole } from "@/components/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminTelegramScreen } from "@/components/admin/admin-telegram";

export const metadata: Metadata = { title: "Telegram Bot" };

export default function AdminTelegramRoute() {
  return (
    <RequireRole roles={["admin"]}>
      <div className="container-site space-y-6 py-10">
        <AdminNav />
        <AdminTelegramScreen />
      </div>
    </RequireRole>
  );
}