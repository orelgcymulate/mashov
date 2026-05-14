import { z } from 'zod';

export const LoginSchema = z.object({
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof LoginSchema>;
