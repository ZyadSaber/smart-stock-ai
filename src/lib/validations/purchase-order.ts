import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  warehouse_id: z.string().min(1, "Warehouse is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unit_price: z.number().positive("Unit price must be positive"),
  purchase_order_id: z.string().min(1),
});

export const purchaseOrderSchema = z.object({
  supplier_name: z.string().min(1, "Supplier name is required").max(200),
  notes: z.string().optional(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "At least one item is required"),
});

export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
export type PurchaseOrderFormInput = z.infer<typeof purchaseOrderSchema>;
