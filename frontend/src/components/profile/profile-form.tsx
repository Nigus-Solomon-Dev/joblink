"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/use-auth";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { cleanProfilePayload, profileSchema, type ProfileFormValues } from "@/lib/validations/auth";
import { isApiError } from "@/types/api";

export function ProfileForm() {
  const { user, status, refetchUser } = useAuth();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      bio: user?.bio ?? "",
      location: user?.location ?? "",
      website: user?.website ?? "",
      linkedin: user?.linkedin ?? "",
    },
  });

  if (status === "loading" || !user) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authApi.updateProfileRequest(cleanProfilePayload(values));
      await refetchUser();
      setSaved(true);
      toast("success", "Profile saved", "Your personal information was updated.");
    } catch (error) {
      setSaved(false);
      setFormError(isApiError(error) ? error.message : "Could not save your profile. Please try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {formError && <Alert variant="danger">{formError}</Alert>}
      {saved && (
        <Alert variant="success" title="Saved">
          Your changes are live.
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="profile-name" required error={errors.name?.message}>
          <Input id="profile-name" autoComplete="name" invalid={Boolean(errors.name)} {...register("name")} />
        </FormField>

        <FormField label="Phone" htmlFor="profile-phone" error={errors.phone?.message}>
          <Input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+251 9 00 000 000"
            invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
        </FormField>

        <FormField label="Location" htmlFor="profile-location" error={errors.location?.message}>
          <Input
            id="profile-location"
            autoComplete="address-level1"
            placeholder="Addis Ababa, Ethiopia"
            invalid={Boolean(errors.location)}
            {...register("location")}
          />
        </FormField>

        <FormField label="Website" htmlFor="profile-website" error={errors.website?.message}>
          <Input
            id="profile-website"
            type="url"
            placeholder="https://yoursite.com"
            invalid={Boolean(errors.website)}
            {...register("website")}
          />
        </FormField>

        <FormField label="LinkedIn" htmlFor="profile-linkedin" error={errors.linkedin?.message}>
          <Input
            id="profile-linkedin"
            type="url"
            placeholder="https://linkedin.com/in/you"
            invalid={Boolean(errors.linkedin)}
            {...register("linkedin")}
          />
        </FormField>
      </div>

      <FormField
        label="Bio"
        htmlFor="profile-bio"
        error={errors.bio?.message}
        hint="Up to 500 characters — what should employers know about you?"
      >
        <Textarea
          id="profile-bio"
          rows={4}
          placeholder="Tell companies about your experience, focus areas, and what you're looking for."
          invalid={Boolean(errors.bio)}
          className="min-h-28"
          {...register("bio")}
        />
      </FormField>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}