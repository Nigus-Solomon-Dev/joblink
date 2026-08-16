"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useToast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  addCompanyMember,
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  getCompanyBySlug,
  getCompanyStats,
  getMyCompanies,
  removeCompanyMember,
  updateCompany,
  updateCompanyMemberRole,
  uploadCompanyCover,
  uploadCompanyLogo,
  type CompanyQueryParams,
} from "@/lib/api/companies";
import type { AddCompanyMemberInput, CompanyUpdateInput } from "@/types";

export function useCompanies(params: CompanyQueryParams = {}) {
  return useQuery({
    queryKey: ["companies", params],
    queryFn: () => getCompanies(params),
    placeholderData: keepPreviousData,
  });
}

export function useCompanyBySlug(slug: string) {
  return useQuery({
    queryKey: ["companies", "slug", slug],
    queryFn: () => getCompanyBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useCompanyById(id: string) {
  return useQuery({
    queryKey: ["companies", "detail", id],
    queryFn: () => getCompanyById(id),
    enabled: Boolean(id),
  });
}

export function useCompanyStats(id: string) {
  return useQuery({
    queryKey: ["companies", "stats", id],
    queryFn: () => getCompanyStats(id),
    enabled: Boolean(id),
  });
}

export function useMyCompanies() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["companies", "mine"],
    queryFn: () => getMyCompanies(),
    enabled: status === "authenticated",
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CompanyUpdateInput) => createCompany(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["employer", "dashboard"] });
      toast("success", "Company created", "Your company profile is live.");
    },
    onError: (error) => {
      toast("error", "Could not create company", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompanyUpdateInput }) => updateCompany(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["companies", "detail"] });
      queryClient.invalidateQueries({ queryKey: ["employer", "dashboard"] });
      toast("success", "Company updated");
    },
    onError: (error) => {
      toast("error", "Could not update company", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["employer", "dashboard"] });
      toast("success", "Company deleted");
    },
    onError: (error) => {
      toast("error", "Could not delete company", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadCompanyLogo(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["companies", "detail"] });
      toast("success", "Logo uploaded");
    },
    onError: (error) => {
      toast("error", "Could not upload logo", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUploadCompanyCover() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadCompanyCover(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["companies", "detail"] });
      toast("success", "Cover image uploaded");
    },
    onError: (error) => {
      toast("error", "Could not upload cover", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useAddCompanyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AddCompanyMemberInput }) => addCompanyMember(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employer", "dashboard", "team", variables.id] });
      toast("success", "Member added");
    },
    onError: (error) => {
      toast("error", "Could not add member", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useRemoveCompanyMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) => removeCompanyMember(id, memberId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employer", "dashboard", "team", variables.id] });
      toast("success", "Member removed");
    },
    onError: (error) => {
      toast("error", "Could not remove member", error instanceof Error ? error.message : undefined);
    },
  });
}

export function useUpdateCompanyMemberRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      memberId,
      role,
    }: {
      id: string;
      memberId: string;
      role: "admin" | "recruiter" | "viewer";
    }) => updateCompanyMemberRole(id, memberId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employer", "dashboard", "team", variables.id] });
      toast("success", "Role updated");
    },
    onError: (error) => {
      toast("error", "Could not update role", error instanceof Error ? error.message : undefined);
    },
  });
}