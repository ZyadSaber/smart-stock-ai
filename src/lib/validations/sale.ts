import { z } from "zod";

export const saleItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  warehouse_id: z.string().min(1, "Warehouse is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unit_price: z.number().positive("Unit price must be positive"),
});

export const saleSchema = z.object({
  customer_id: z.string().min(1, "Customer name is required"),
  customer_name: z.string(),
  notes: z.string().optional(),
  items_data: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;
export type SaleFormInput = z.infer<typeof saleSchema>;
