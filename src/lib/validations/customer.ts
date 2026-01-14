import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string(),
  location: z.string(),
});

export type CustomerFormInput = z.infer<typeof customerSchema>;
