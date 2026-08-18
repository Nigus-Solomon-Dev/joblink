"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Avatar, Skeleton } from "@/components/ui";
import { AvatarCropModal } from "@/components/profile/avatar-crop-modal";
import { isApiError } from "@/types/api";

export function AvatarUploader() {
  const { user, status, refetchUser } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ url: string; name: string } | null>(null);
  const [applying, setApplying] = useState(false);

  if (status === "loading" || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="mx-auto size-20 rounded-full" />
        <Skeleton className="mx-auto h-4 w-28" />
        <Skeleton className="mx-auto h-3 w-40" />
      </div>
    );
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPending({ url: URL.createObjectURL(file), name: file.name });
  };

  const onCancel = () => {
    setPending((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const onApply = async (blob: Blob, fileName: string) => {
    if (!blob) return;
    setApplying(true);
    try {
      const file = new File([blob], fileName, { type: blob.type });
      await authApi.updateAvatarRequest(file);
      await refetchUser();
      toast("success", "Profile picture updated");
      onCancel();
    } catch (error) {
      toast("error", "Upload failed", isApiError(error) ? error.message : "Please try another image.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <Avatar src={user.avatar} name={user.name} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={Boolean(pending) || applying}
          aria-label="Change profile picture"
          className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border border-border bg-surface text-slate-600 shadow-card transition-colors hover:bg-surface-muted disabled:opacity-60"
        >
          {applying ? (
            <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600" />
          ) : (
            <Camera className="size-4" />
          )}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-hidden="true"
        onChange={onFileChange}
      />
      <div>
        <p className="text-sm font-semibold text-foreground">{user.name}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>
      <AvatarCropModal
        open={Boolean(pending)}
        imageUrl={pending?.url ?? null}
        fileName={pending?.name ?? "avatar"}
        onCancel={onCancel}
        onApply={onApply}
        applying={applying}
      />
    </div>
  );
}