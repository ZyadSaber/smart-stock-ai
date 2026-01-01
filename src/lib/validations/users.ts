import { z } from "zod";

export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters long"),
  active: z.boolean(),
});
