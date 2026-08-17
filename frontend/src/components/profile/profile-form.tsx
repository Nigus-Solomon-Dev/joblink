"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { useAuth } from "@/hooks/use-auth";
import { useAllSkills } from "@/hooks/use-categories";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
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
  const allSkills = useAllSkills(500);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");

  const {
    control,
    register,
    handleSubmit,
    setValue,
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
      skills: user?.skills ?? [],
    },
  });

  const selectedSkills = useWatch({ control, name: "skills" }) ?? [];
  const skillOptions = allSkills.data?.data ?? [];
  const skillSearch = skillQuery.trim().toLowerCase();
  const visibleSkills = skillSearch
    ? skillOptions.filter((skill) => skill.name.toLowerCase().includes(skillSearch))
    : skillOptions;

  const toggleSkill = (id: string) => {
    if (selectedSkills.includes(id)) {
      setValue("skills", selectedSkills.filter((s) => s !== id));
    } else {
      setValue("skills", [...selectedSkills, id]);
    }
  };

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

      <FormField
        label="Skills"
        htmlFor="profile-skills"
        error={errors.skills?.message}
        hint="Add the skills you offer — we use them to recommend matching jobs."
      >
        <div className="space-y-3">
          {selectedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedSkills.map((id) => {
                const skill = skillOptions.find((option) => option._id === id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSkill(id)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
                    aria-label={`Remove ${skill?.name ?? id}`}
                  >
                    {skill?.name ?? id}
                    <span aria-hidden="true">×</span>
                  </button>
                );
              })}
            </div>
          )}

          <Input
            id="profile-skills"
            value={skillQuery}
            onChange={(event) => setSkillQuery(event.target.value)}
            placeholder="Search skills to add…"
            aria-label="Search skills"
          />

          <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-surface-muted/50 p-2">
            {allSkills.isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-6 w-48" />
              </div>
            ) : visibleSkills.length === 0 ? (
              <p className="p-2 text-sm text-slate-500">
                No skills match &ldquo;{skillQuery}&rdquo;.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {visibleSkills.slice(0, 150).map((skill) => {
                  const selected = selectedSkills.includes(skill._id);
                  return (
                    <button
                      key={skill._id}
                      type="button"
                      onClick={() => toggleSkill(skill._id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary-600 bg-primary-600 text-white"
                          : "border-border-strong bg-surface text-slate-700 hover:border-primary-300 hover:bg-primary-50",
                      )}
                    >
                      {skill.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </FormField>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}