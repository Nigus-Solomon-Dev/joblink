"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Alert, Button, FormField, Input, Textarea, useToast } from "@/components/ui";
import { useApply } from "@/hooks/use-applications";
import { isApiError } from "@/types/api";
import type { ApplyPayload } from "@/lib/api/applications";
import {
  applySchema,
  cleanApplyPayload,
  type ApplyFormValues,
} from "@/lib/validations/jobs";

export interface ApplyFormProps {
  jobId: string;
  onSubmitted?: () => void;
}

export function ApplyForm({ jobId, onSubmitted }: ApplyFormProps) {
  const { toast } = useToast();
  const applyMutation = useApply(jobId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      coverLetter: "",
      resume: "",
      portfolio: "",
      expectedSalary: "",
      availabilityDate: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = cleanApplyPayload(values);
      await applyMutation.mutateAsync(payload as ApplyPayload);
      toast("success", "Application submitted", "The employer has been notified.");
      onSubmitted?.();
    } catch (error) {
      toast("error", "Could not submit application", error instanceof Error ? error.message : undefined);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField
        label="Cover letter"
        htmlFor="apply-cover-letter"
        hint="A short note about why you're a good fit. Optional."
        error={errors.coverLetter?.message}
      >
        <Textarea
          id="apply-cover-letter"
          rows={6}
          placeholder="Tell the employer what makes you right for this role…"
          invalid={Boolean(errors.coverLetter)}
          {...register("coverLetter")}
        />
      </FormField>

      <FormField
        label="Resume link"
        htmlFor="apply-resume"
        hint="Paste a link to your resume if you have one hosted online."
        error={errors.resume?.message}
      >
        <Input
          id="apply-resume"
          placeholder="https://…"
          invalid={Boolean(errors.resume)}
          {...register("resume")}
        />
      </FormField>

      <FormField
        label="Portfolio"
        htmlFor="apply-portfolio"
        hint="A link to your portfolio, GitHub, or samples of your work."
        error={errors.portfolio?.message}
      >
        <Input
          id="apply-portfolio"
          placeholder="https://…"
          invalid={Boolean(errors.portfolio)}
          {...register("portfolio")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Expected salary (ETB)"
          htmlFor="apply-salary"
          hint="Monthly. Optional."
          error={errors.expectedSalary?.message}
        >
          <Input
            id="apply-salary"
            type="number"
            min={0}
            placeholder="0"
            invalid={Boolean(errors.expectedSalary)}
            {...register("expectedSalary")}
          />
        </FormField>

        <FormField
          label="Availability date"
          htmlFor="apply-availability"
          hint="When you can start. Optional."
          error={errors.availabilityDate?.message}
        >
          <Input
            id="apply-availability"
            type="date"
            invalid={Boolean(errors.availabilityDate)}
            {...register("availabilityDate")}
          />
        </FormField>
      </div>

      {applyMutation.isError && (
        <Alert variant="danger" title={isApiError(applyMutation.error) ? applyMutation.error.message : "Application failed"}>
          {isApiError(applyMutation.error) && `Something went wrong. ${applyMutation.error.message}`}
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting || applyMutation.isPending} fullWidth>
          {isSubmitting || applyMutation.isPending ? "Submitting…" : "Submit application"}
        </Button>
      </div>
    </form>
  );
}