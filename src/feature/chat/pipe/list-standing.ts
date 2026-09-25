import * as z from 'zod';

export const listStandingSchema = z.object({
  // status: z.string(),
  season: z.string(),
  competition: z.string(),
});
