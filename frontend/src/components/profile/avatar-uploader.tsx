"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Avatar, Skeleton } from "@/components/ui";
import { isApiError } from "@/types/api";

export function AvatarUploader() {
  const { user, status, refetchUser } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (status === "loading" || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mx-auto h-4 w-28" />
        <Skeleton className="mx-auto h-3 w-40" />
      </div>
    );
  }

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      await authApi.updateAvatarRequest(file);
      await refetchUser();
      toast("success", "Profile picture updated");
    } catch (error) {
      toast("error", "Upload failed", isApiError(error) ? error.message : "Please try another image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <Avatar src={user.avatar} name={user.name} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change profile picture"
          className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border border-border bg-surface text-slate-600 shadow-card transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          {uploading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600" />
          ) : (
            <Camera className="size-4" />
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        onChange={onFileChange}
      />
      <div>
        <p className="text-sm font-semibold text-foreground">{user.name}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>
    </div>
  );
}