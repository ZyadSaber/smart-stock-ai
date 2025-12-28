import * as z from "zod";

export const productSchema = z
  .object({
    name: z.string().min(3, "Product name must be at least 3 characters"),
    barcode: z.string().min(5, "Invalid barcode"),
    category_id: z.string().min(1, "Please select a category"),
    cost_price: z.coerce.number().min(0.01, "Cost must be greater than 0"),
    selling_price: z.coerce
      .number()
      .min(0.01, "Selling price must be greater than 0"),
  })
  .refine((data) => data.selling_price >= data.cost_price, {
    message: "Selling price cannot be less than cost price",
    path: ["selling_price"], // الخطأ هيظهر تحت خانة سعر البيع
  });
