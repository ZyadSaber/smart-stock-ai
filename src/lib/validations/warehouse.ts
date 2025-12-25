import { z } from "zod";

export const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, "Warehouse name is required")
    .max(100, "Warehouse name is too long"),
  location: z.string().optional(),
});

export type WarehouseFormInput = z.infer<typeof warehouseSchema>;
