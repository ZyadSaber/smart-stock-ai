import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string(),
  location: z.string(),
});

export type SupplierFormInput = z.infer<typeof supplierSchema>;
