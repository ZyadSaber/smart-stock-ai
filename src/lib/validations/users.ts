import { z } from "zod";

export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters long"),
  active: z.boolean(),
});

export const branchSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters long"),
  organization_id: z.string().min(1, "Organization number is required"),
  location: z.string(),
});
