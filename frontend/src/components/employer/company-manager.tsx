"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Camera, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  Button,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from "@/components/ui";
import { CompanyLogo } from "@/components/companies/company-logo";
import {
  useAddCompanyMember,
  useCreateCompany,
  useMyCompanies,
  useRemoveCompanyMember,
  useUpdateCompany,
  useUpdateCompanyMemberRole,
  useUploadCompanyCover,
  useUploadCompanyLogo,
} from "@/hooks/use-companies";
import { useCompanyTeam } from "@/hooks/use-employer-dashboard";
import {
  cleanCompanyPayload,
  companyFormSchema,
  type CompanyFormValues,
} from "@/lib/validations/employer";
import { companyMemberRoleLabels } from "@/lib/format";
import type { CompanyWithStats } from "@/types";

const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

function CompanyForm({
  initialValues,
  onSubmit,
  submitLabel,
  busy,
}: {
  initialValues?: Partial<CompanyFormValues>;
  onSubmit: (values: CompanyFormValues) => void;
  submitLabel: string;
  busy: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
      industry: "",
      size: "1-10",
      location: "",
      foundedYear: "",
      linkedin: "",
      twitter: "",
      facebook: "",
      ...initialValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <FormField label="Company name" htmlFor="name" required error={errors.name?.message} className="sm:col-span-2">
        <Input id="name" placeholder="e.g. Addis Coffee Roasters" {...register("name")} invalid={Boolean(errors.name)} />
      </FormField>

      <FormField label="Description" htmlFor="description" required error={errors.description?.message} hint="What does your company do? Paint a picture for applicants." className="sm:col-span-2">
        <Textarea id="description" rows={4} placeholder="Tell applicants about your mission, product and culture…" {...register("description")} invalid={Boolean(errors.description)} />
      </FormField>

      <FormField label="Website" htmlFor="website" error={errors.website?.message}>
        <Input id="website" type="url" placeholder="https://example.com" {...register("website")} invalid={Boolean(errors.website)} />
      </FormField>

      <FormField label="Industry" htmlFor="industry" error={errors.industry?.message}>
        <Input id="industry" placeholder="e.g. Technology, Finance" {...register("industry")} invalid={Boolean(errors.industry)} />
      </FormField>

      <FormField label="Company size" htmlFor="size">
        <Select id="size" {...register("size")}>
          {SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Location" htmlFor="location" error={errors.location?.message}>
        <Input id="location" placeholder="e.g. Addis Ababa" {...register("location")} invalid={Boolean(errors.location)} />
      </FormField>

      <FormField label="Founded year" htmlFor="foundedYear" error={errors.foundedYear?.message}>
        <Input id="foundedYear" inputMode="numeric" placeholder="e.g. 2015" {...register("foundedYear")} invalid={Boolean(errors.foundedYear)} />
      </FormField>

      <FormField label="LinkedIn" htmlFor="linkedin" error={errors.linkedin?.message}>
        <Input id="linkedin" placeholder="https://linkedin.com/company/…" {...register("linkedin")} invalid={Boolean(errors.linkedin)} />
      </FormField>

      <FormField label="Twitter / X" htmlFor="twitter" error={errors.twitter?.message}>
        <Input id="twitter" placeholder="https://twitter.com/…" {...register("twitter")} invalid={Boolean(errors.twitter)} />
      </FormField>

      <FormField label="Facebook" htmlFor="facebook" error={errors.facebook?.message}>
        <Input id="facebook" placeholder="https://facebook.com/…" {...register("facebook")} invalid={Boolean(errors.facebook)} />
      </FormField>

      <div className="sm:col-span-2">
        <Button type="submit" loading={busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function toCompanyFormValues(company: CompanyWithStats): Partial<CompanyFormValues> {
  return {
    name: company.name,
    description: company.description,
    website: company.website ?? "",
    industry: company.industry ?? "",
    size: company.size,
    location: company.location ?? "",
    foundedYear: company.foundedYear ? Number(company.foundedYear) : "",
    linkedin: company.socialLinks?.linkedin ?? "",
    twitter: company.socialLinks?.twitter ?? "",
    facebook: company.socialLinks?.facebook ?? "",
  };
}

function UploadImageButton({
  label,
  onPick,
  busy,
}: {
  label: string;
  onPick: (file: File) => void;
  busy: boolean;
}) {
  const inputId = `file-${label.replaceAll(" ", "-")}`;
  return (
    <label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50">
      <Camera className="size-4" />
      {label}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}

function MembersPanel({ company }: { company: CompanyWithStats }) {
  const { toast } = useToast();
  const team = useCompanyTeam(company._id);
  const addMember = useAddCompanyMember();
  const removeMember = useRemoveCompanyMember();
  const updateRole = useUpdateCompanyMemberRole();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "recruiter" | "viewer">("viewer");

  const members = team.data?.members ?? [];

  const handleAdd = () => {
    if (!userId.trim()) {
      toast("error", "Enter a user ID");
      return;
    }
    addMember.mutate(
      { id: company._id, input: { userId: userId.trim(), role } },
      {
        onSuccess: () => {
          setOpen(false);
          setUserId("");
          setRole("viewer");
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Team members</p>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add member
        </Button>
      </div>

      {team.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!team.isPending && members.length === 0 && (
        <p className="text-sm text-slate-500">The owner is the only member right now.</p>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        {members.map((member) => {
          const name = member.user?.name ?? "Team member";
          const email = member.user?.email;
          const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
          const canEdit = member.role !== "owner";
          return (
            <div key={String(member.userId)} className="flex items-center gap-3 px-4 py-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {name}
                  {member.role === "owner" && <span className="ml-1.5 text-xs font-normal text-primary-600">Owner</span>}
                </p>
                {email && <p className="truncate text-xs text-slate-500">{email}</p>}
              </div>
              {canEdit && (
                <>
                  <Select
                    aria-label="Member role"
                    defaultValue={member.role}
                    className="h-8 w-auto text-xs"
                    disabled={updateRole.isPending}
                    onChange={(event) =>
                      updateRole.mutate({
                        id: company._id,
                        memberId: String(member.userId),
                        role: event.target.value as "admin" | "recruiter" | "viewer",
                      })
                    }
                  >
                    {(["admin", "recruiter", "viewer"] as const).map((option) => (
                      <option key={option} value={option}>
                        {companyMemberRoleLabels[option]}
                      </option>
                    ))}
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${name}`}
                    disabled={removeMember.isPending}
                    onClick={() => removeMember.mutate({ id: company._id, memberId: String(member.userId) })}
                  >
                    <Trash2 className="size-4 text-danger-600" />
                  </Button>
                </>
              )}
              {!canEdit && (
                <span className="text-xs text-slate-500">{companyMemberRoleLabels[member.role]}</span>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a team member"
        description="Enter the user's ID and pick a role. The person must already have an account."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} loading={addMember.isPending}>
              Add member
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <FormField label="User ID" htmlFor="member-userId" required>
            <Input id="member-userId" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="64-char Mongo user id" />
          </FormField>
          <FormField label="Role" htmlFor="member-role">
            <Select id="member-role" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              {(["admin", "recruiter", "viewer"] as const).map((option) => (
                <option key={option} value={option}>
                  {companyMemberRoleLabels[option]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

function ManageCompany({ company }: { company: CompanyWithStats }) {
  const update = useUpdateCompany();
  const uploadLogo = useUploadCompanyLogo();
  const uploadCover = useUploadCompanyCover();

  const handleSubmit = (values: CompanyFormValues) => {
    update.mutate({ id: company._id, input: cleanCompanyPayload(values) });
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {company.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.coverImage} alt="" className="h-36 w-full object-cover" />
        ) : (
          <div className="h-36 w-full bg-gradient-to-br from-primary-100 to-accent-100" />
        )}
        <div className="px-5 pb-5">
          <div className="-mt-8 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-2xl border-4 border-surface bg-surface">
              <CompanyLogo name={company.name} logo={company.logo} size="lg" />
            </div>
            <div className="flex gap-2">
              <UploadImageButton label="Logo" busy={uploadLogo.isPending} onPick={(file) => uploadLogo.mutate({ id: company._id, file })} />
              <UploadImageButton label="Cover" busy={uploadCover.isPending} onPick={(file) => uploadCover.mutate({ id: company._id, file })} />
            </div>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground">{company.name}</h1>
          <p className="text-sm text-slate-500">
            {company.location || "Location not set"}
            {company.website ? ` · ${company.website.replace(/^https?:\/\//, "")}` : ""}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">Company profile</h2>
        <CompanyForm
          initialValues={toCompanyFormValues(company)}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          busy={update.isPending}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground">Team</h2>
        <MembersPanel company={company} />
      </div>
    </div>
  );
}

export function CompanyManager() {
  const router = useRouter();
  const companies = useMyCompanies();
  const create = useCreateCompany();

  if (companies.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const list = companies.data?.companies ?? [];
  const company = list[0];

  const handleCreate = (values: CompanyFormValues) => {
    create.mutate(cleanCompanyPayload(values), {
      onSuccess: () => router.push("/employer/jobs/new"),
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">Company</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {company ? "Your company" : "Set up your company"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {company
            ? "Keep your profile fresh — applicants see this when they look you up."
            : "Create a company profile to start posting jobs. Each account can own one company."}
        </p>
      </header>

      {company ? (
        <ManageCompany company={company} />
      ) : (
        <div className="max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-card">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-primary-50 text-primary-700">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Create your company</h2>
              <p className="text-sm text-slate-500">You&rsquo;ll be added as the owner.</p>
            </div>
          </div>
          <CompanyForm onSubmit={handleCreate} submitLabel="Create company" busy={create.isPending} />
        </div>
      )}
    </div>
  );
}