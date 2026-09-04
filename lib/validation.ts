import { z } from "zod";

export const slugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const gameWriteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: slugSchema,
  description: z.string().trim().min(1).max(4000),
  categoryId: z.string().min(1),
  tagIds: z.array(z.string()).max(20).optional().default([]),
  controls: z.string().trim().max(500).optional().nullable(),
  developer: z.string().trim().max(120).optional().nullable(),
  releaseDate: z.string().datetime().optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  thumbnailUrl: z.string().optional().nullable(),
  entryPath: z.string().optional(),
  sourceType: z.literal("html_upload").optional().default("html_upload"),
});

export const gamePatchSchema = gameWriteSchema.partial().extend({
  slug: slugSchema.optional(),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(4000).optional(),
  categoryId: z.string().min(1).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  tag: z.string().trim().max(80).optional().default(""),
  sort: z
    .enum(["popular", "newest", "alphabetical", "rating"])
    .optional()
    .default("popular"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional().default(24),
  slugs: z.string().optional(),
});

export const rateSchema = z.object({
  value: z.number().int().min(1).max(5),
});

export const reportSchema = z.object({
  gameId: z.string().min(1),
  message: z.string().trim().min(8).max(1000),
});

export const categoryWriteSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: slugSchema.optional(),
});

export const tagWriteSchema = z.object({
  name: z.string().trim().min(1).max(40),
  slug: slugSchema.optional(),
});

export const loginSchema = z.object({
  // Avoid z.string().email() — it rejects hosts like "localhost" which we use in local admin accounts.
  email: z.string().trim().toLowerCase().min(3).max(120),
  password: z.string().min(1).max(200),
});

export const sortLabels = {
  popular: "Popular",
  newest: "Newest",
  alphabetical: "Alphabetical",
  rating: "Highest Rated",
} as const;
