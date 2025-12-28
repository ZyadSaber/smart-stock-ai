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

  return data.map(
    ({
      id,
      name,
      barcode,
      cost_price,
      selling_price,
      category_id,
      categories,
      product_stocks,
    }) => ({
      id: id,
      name: name,
      barcode: barcode,
      cost_price: cost_price,
      selling_price: selling_price,
      category_id: category_id,
      category:
        (categories as unknown as { name: string })?.name || "Uncategorized",
      price: selling_price,
      stock: product_stocks?.reduce((acc, curr) => acc + curr.quantity, 0) || 0,
    })
  );
}
