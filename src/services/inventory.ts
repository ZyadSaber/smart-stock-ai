import isArrayHasData from "@/lib/isArrayHasData";
import { createClient } from "@/utils/supabase/server";

export async function getInventoryData() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("products").select(`
      id,
      name,
      barcode,
      cost_price,
      selling_price,
      category_id,
      categories (name),
      product_stocks (quantity)
    `);

  if (error) throw error;

  // تنظيف البيانات لتبسيط التعامل معها في الـ Component
  return data.map((product) => ({
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    cost_price: product.cost_price,
    selling_price: product.selling_price,
    category_id: product.category_id,
    category:
      (isArrayHasData(product.categories)
        ? product.categories[0].name
        : null) || "Uncategorized",
    price: product.selling_price,
    stock:
      product.product_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) ||
      0,
  }));
}
