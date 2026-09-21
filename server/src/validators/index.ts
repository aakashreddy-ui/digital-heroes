import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const scoreSchema = z.object({
  score: z.coerce.number().int().min(1).max(45),
  score_date: z.string().min(8),
  course_name: z.string().optional(),
  notes: z.string().optional(),
});

export const charitySelectionSchema = z.object({
  charity_id: z.string().min(1),
  contribution_percentage: z.coerce.number().int().min(10).max(100),
});

export const checkoutSchema = z.object({
  plan_id: z.enum(['monthly', 'yearly']),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export const donationSchema = z.object({
  charity_id: z.string().min(1),
  amount_cents: z.coerce.number().int().positive(),
  frequency: z.enum(['one_off', 'monthly']).optional(),
  donor_name: z.string().optional(),
  donor_email: z.string().email().optional().or(z.literal('')),
});

export function validate<T>(schema: z.ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const err: any = new Error(result.error.issues[0]?.message || 'Invalid request');
    err.statusCode = 400;
    err.errorCode = 'VALIDATION_ERROR';
    throw err;
  }
  return result.data;
}
