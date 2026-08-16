import { z } from "zod";

const PASSWORD_MIN = "Password must be at least 8 characters.";
const PASSWORD_POLICY =
  "Password must contain an uppercase letter, a lowercase letter, a number, and a special character (@ $ ! % * ? &).";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const emailSchema = z
  .string()
  .min(1, "Email is required.")
  .email("Please provide a valid email.");

export const passwordSchema = z
  .string()
  .min(8, PASSWORD_MIN)
  .regex(PASSWORD_REGEX, PASSWORD_POLICY);

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be between 2 and 100 characters.")
  .max(100, "Name must be between 2 and 100 characters.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    role: z.enum(["job_seeker", "employer"]),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const phoneSchema = z
  .string()
  .trim()
  .max(20, "Please provide a valid phone number.")
  .refine((value) => value === "" || /^\+?[1-9]\d{1,14}$/.test(value), "Please provide a valid phone number.");

const linkedinSchema = z
  .string()
  .trim()
  .max(200, "Please provide a valid LinkedIn URL.")
  .refine(
    (value) => value === "" || /^https?:\/\/(www\.)?linkedin\.com\/.*/.test(value),
    "Please provide a valid LinkedIn URL.",
  );

export const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  bio: z.string().trim().max(500, "Bio cannot exceed 500 characters."),
  location: z.string().trim().max(100, "Location cannot exceed 100 characters."),
  website: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\/.+\..+/.test(value), "Please provide a valid URL."),
  linkedin: linkedinSchema,
});
export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Collapses empty optional strings to `undefined` so the backend skips them. */
export function cleanProfilePayload(
  values: ProfileFormValues,
): Partial<Pick<ProfileFormValues, "name" | "phone" | "bio" | "location" | "website" | "linkedin">> {
  const cleaned: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim();
    cleaned[key] = trimmed === "" ? undefined : trimmed;
  }
  return cleaned;
}