import { createClient } from "@/utils/supabase/server";

export async function getInventoryData() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("products").select(`
      id,
      name,
      barcode,
      cost_price,
      selling_price,
      categories (name),
      product_stocks (quantity)
    `);

  if (error) throw error;

  // تنظيف البيانات لتبسيط التعامل معها في الـ Component
  return data.map((product) => ({
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    category: product.categories?.name || "Uncategorized",
    price: product.selling_price,
    stock:
      product.product_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) ||
      0,
  }));
}
