import { z } from "zod";

export const stockMovementSchema = z
  .object({
    product_id: z.string().min(1, "Please select a product"),
    from_warehouse_id: z.string().optional(),
    to_warehouse_id: z.string().optional(),
    quantity: z.number().int().positive("Quantity must be positive"),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      (data.from_warehouse_id && data.from_warehouse_id !== "none") ||
      (data.to_warehouse_id && data.to_warehouse_id !== "none"),
    {
      message: "Either source or destination warehouse must be specified",
      path: ["from_warehouse_id"],
    }
  )
  .refine((data) => data.from_warehouse_id !== data.to_warehouse_id, {
    message: "Source and destination warehouses must be different",
    path: ["to_warehouse_id"],
  });

export type StockMovementFormInput = z.infer<typeof stockMovementSchema>;
