import { z } from 'zod';
import { baseEntity } from './common';

export const KidCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'lowercase letters, digits, dashes only'),
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'hex color like #ff6f9c'),
});

export const KidUpdateSchema = KidCreateSchema.partial();

export const KidSchema = KidCreateSchema.extend(baseEntity.shape);

export type KidCreate = z.infer<typeof KidCreateSchema>;
export type KidUpdate = z.infer<typeof KidUpdateSchema>;
export type Kid = z.infer<typeof KidSchema>;
