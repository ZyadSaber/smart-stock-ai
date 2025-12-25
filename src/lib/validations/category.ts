import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name is too long"),
});

export type CategoryFormInput = z.infer<typeof categorySchema>;
