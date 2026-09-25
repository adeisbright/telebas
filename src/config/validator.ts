import * as z from 'zod';

export const configValidationSchema = z.object({
  GEMINI_MODEL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  PAYSTACK_PUBLIC_KEY: z.string().min(1),
  PAYSTACK_TRANSACTION_URL: z.string().min(1),
  TELEGRAM_BASE_URL: z.string().min(1),
  TELEGRAM_TOKEN: z.string().min(1),
});
