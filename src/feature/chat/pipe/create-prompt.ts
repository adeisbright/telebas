import * as z from 'zod';

export const createPromptSchema = z.object({
  update_id: z.number(),

  message: z.object({
    message_id: z.number(),

    from: z.object({
      id: z.number(),
      is_bot: z.boolean(),
      first_name: z.string(),
      language_code: z.string(),
    }),

    chat: z.object({
      id: z.number(),
      first_name: z.string(),
      type: z.enum(['private', 'public']),
    }),

    date: z.number(),
    text: z.string(),
  }),
});
