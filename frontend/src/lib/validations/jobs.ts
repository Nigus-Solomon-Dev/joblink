import { z } from "zod";

export const applySchema = z.object({
  coverLetter: z
    .string()
    .max(2000, "Cover letter cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),
  resume: z.string().trim().max(500, "Resume link is too long").optional(),
  portfolio: z
    .union([z.literal(""), z.string().trim().url("Enter a valid URL")])
    .optional(),
  expectedSalary: z
    .union([
      z.literal(""),
      z.string().trim().regex(/^\d+$/, "Enter a whole number"),
    ])
    .optional(),
  availabilityDate: z.union([z.literal(""), z.string().trim()]).optional(),
});

export type ApplyFormValues = z.infer<typeof applySchema>;

/** Collapse empty strings to `undefined` and normalize numbers/dates for the API. */
export function cleanApplyPayload(values: ApplyFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (values.coverLetter?.trim()) payload.coverLetter = values.coverLetter.trim();
  if (values.resume?.trim()) payload.resume = values.resume.trim();
  if (values.portfolio?.trim()) payload.portfolio = values.portfolio.trim();
  if (values.expectedSalary && values.expectedSalary !== "") {
    payload.expectedSalary = Number(values.expectedSalary);
  }
  if (values.availabilityDate?.trim()) payload.availabilityDate = values.availabilityDate;

  return payload;
}