"use client";

import { useState } from "react";
import { FolderTree, Pencil, Plus, Trash2, Wrench } from "lucide-react";

import {
  Badge,
  Button,
  ErrorState,
  FormField,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
} from "@/components/ui";
import { useAllCategories } from "@/hooks/use-categories";
import {
  useAdminCategoryMutations,
  useAdminSkillMutations,
} from "@/hooks/use-admin";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api";
import type { Category, Skill } from "@/types";

function EmptyPanel({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-slate-500">{message}</p>;
}

export function AdminCategoriesSkillsScreen() {
  const [tab, setTab] = useState<"categories" | "skills">("categories");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Admin · Taxonomy
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Categories &amp; skills
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Organize the platform taxonomy that powers job discovery.
        </p>
      </header>

      <div
        role="tablist"
        className="flex gap-1 border-b border-border"
        onKeyDown={(event) => {
          const tabs = Array.from((event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]'));
          const currentIndex = tabs.findIndex((tab) => tab === document.activeElement);
          if (currentIndex === -1) return;
          let next = currentIndex;
          if (event.key === "ArrowRight") next += 1;
          else if (event.key === "ArrowLeft") next -= 1;
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = tabs.length - 1;
          else return;
          event.preventDefault();
          tabs[(next + tabs.length) % tabs.length]?.focus();
        }}
      >
        {(["categories", "skills"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            className={cn("border-b-2 -mb-px px-3 py-2 text-sm font-medium transition-colors", tab === key ? "border-primary-600 text-primary-700" : "border-transparent text-slate-500 hover:text-foreground")}
          >
            {key === "categories" ? "Categories" : "Skills"}
          </button>
        ))}
      </div>

      {tab === "categories" ? <CategoriesPanel /> : <SkillsPanel />}
    </div>
  );
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function CategoriesPanel() {
  const categories = useAllCategories();
  const mutations = useAdminCategoryMutations();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const list = categories.data ?? [];

  const openCreate = () => {
    setName("");
    setDescription("");
    setIcon("");
    setParentId("");
    setIsActive(true);
    setCreating(true);
  };

  const openEdit = (category: Category) => {
    setName(category.name);
    setDescription(category.description ?? "");
    setIcon(category.icon ?? "");
    setParentId(category.parentId ?? "");
    setIsActive(category.isActive ?? true);
    setEditing(category);
  };

  const save = () => {
    const input = { name, description: description || undefined, icon: icon || undefined, parentId: parentId || undefined, isActive };
    if (creating) {
      mutations.create.mutate(input, { onSuccess: () => { setCreating(false); setName(""); } });
    } else if (editing) {
      mutations.update.mutate({ id: editing._id, input }, { onSuccess: () => setEditing(null) });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <FolderTree className="size-4 text-primary-600" />
          <span className="text-sm font-semibold text-foreground">
            {list.length} categories
          </span>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      {categories.isError ? (
        <div className="p-5">
          <ErrorState
            title="Couldn't load categories"
            message="Something went wrong while fetching categories."
            onRetry={() => categories.refetch()}
          />
        </div>
      ) : categories.isPending ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : list.length === 0 ? (
        <div className="p-5"><EmptyPanel message="No categories yet." /></div>
      ) : (
        <ul className="divide-y divide-border">
          {list.map((category) => (
            <li key={category._id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {category.slug}{category.jobsCount != null ? ` · ${category.jobsCount} jobs` : ""}
                </p>
              </div>
              <Badge variant={category.isActive ?? true ? "success" : "neutral"}>
                {category.isActive ?? true ? "Active" : "Inactive"}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setDeleting(category)} aria-label={`Delete ${category.name}`}>
                <Trash2 className="size-4 text-danger-600" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => { setCreating(false); setEditing(null); }}
        title={creating ? "New category" : "Edit category"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={save} loading={mutations.create.isPending || mutations.update.isPending} disabled={!name.trim()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" htmlFor="admin-category-name">
            <Input id="admin-category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Engineering" />
          </FormField>
          <FormField label="Description" htmlFor="admin-category-description">
            <Input id="admin-category-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormField>
          <FormField label="Icon (name)" htmlFor="admin-category-icon">
            <Input id="admin-category-icon" value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="e.g. code" />
          </FormField>
          <FormField label="Parent category" htmlFor="admin-category-parent">
            <Select id="admin-category-parent" value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">None (top level)</option>
              {list
                .filter((category) => category._id !== editing?._id)
                .map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
            </Select>
          </FormField>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="size-4 accent-primary-600"
            />
            Active
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete category"
        description={deleting ? `${deleting.name} will be removed from the taxonomy.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={mutations.remove.isPending}
              onClick={() => {
                if (deleting) mutations.remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Jobs linked to this category may lose their association.</p>
      </Modal>
    </div>
  );
}

function SkillsPanel() {
  const skills = useQuery({
    queryKey: ["skills", "manage", "all"],
    queryFn: () => categoriesApi.getAllSkills({ limit: 500 }),
    staleTime: 30_000,
  });
  const mutations = useAdminSkillMutations();
  const [editing, setEditing] = useState<Skill | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Skill | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = skills.data?.meta.totalPages ?? 0;
  const list = skills.data?.data ?? [];
  const pageSkills = list.filter((_, index) => index >= (page - 1) * 20 && index < page * 20);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const openCreate = () => {
    setName("");
    setCategory("");
    setDescription("");
    setCreating(true);
  };

  const openEdit = (skill: Skill) => {
    setName(skill.name);
    setCategory(skill.category ?? "");
    setDescription(skill.description ?? "");
    setEditing(skill);
  };

  const save = () => {
    const input = { name, category: category || undefined, description: description || undefined };
    if (creating) {
      mutations.create.mutate(input, { onSuccess: () => setCreating(false) });
    } else if (editing) {
      mutations.update.mutate({ id: editing._id, input }, { onSuccess: () => setEditing(null) });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-primary-600" />
          <span className="text-sm font-semibold text-foreground">
            {skills.data?.meta.total ?? "..."} skills
          </span>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          New skill
        </Button>
      </div>

      {skills.isError ? (
        <div className="p-5">
          <ErrorState
            title="Couldn't load skills"
            message="Something went wrong while fetching skills."
            onRetry={() => skills.refetch()}
          />
        </div>
      ) : skills.isPending ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : pageSkills.length === 0 ? (
        <div className="p-5"><EmptyPanel message="No skills yet." /></div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {pageSkills.map((skill) => (
              <li key={skill._id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{skill.name}</p>
                  <p className="truncate text-xs text-slate-500">{skill.category || "Uncategorized"}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(skill)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(skill)} aria-label={`Delete ${skill.name}`}>
                  <Trash2 className="size-4 text-danger-600" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-3">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <Modal
        open={creating || Boolean(editing)}
        onClose={() => { setCreating(false); setEditing(null); }}
        title={creating ? "New skill" : "Edit skill"}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={save} loading={mutations.create.isPending || mutations.update.isPending} disabled={!name.trim()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Name" htmlFor="admin-skill-name">
            <Input id="admin-skill-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. React" />
          </FormField>
          <FormField label="Category" htmlFor="admin-skill-category">
            <Input id="admin-skill-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Frontend" />
          </FormField>
          <FormField label="Description" htmlFor="admin-skill-description">
            <Input id="admin-skill-description" value={description} onChange={(event) => setDescription(event.target.value)} />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete skill"
        description={deleting ? `${deleting.name} will be removed from the taxonomy.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              loading={mutations.remove.isPending}
              onClick={() => {
                if (deleting) mutations.remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Jobs referencing this skill may show it as missing afterwards.</p>
      </Modal>
    </div>
  );
}