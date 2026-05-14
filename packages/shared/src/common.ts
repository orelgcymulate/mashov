import { z } from 'zod';

export const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const dateLike = z.union([z.string().datetime(), z.date()]).transform((v) => (v instanceof Date ? v.toISOString() : v));

export const baseEntity = z.object({
  _id: objectId,
  createdAt: dateLike,
  updatedAt: dateLike,
});

export type ID = z.infer<typeof objectId>;
