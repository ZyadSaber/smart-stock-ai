import { createClient } from "@/utils/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // Calculate global stats from product_stocks and products
  // aggregating across all warehouses
  const { data, error } = await supabase.from("product_stocks").select(`
      quantity,
      products (
        cost_price,
        selling_price
      )
    `);

  if (error) {
    console.error("Error fetching dashboard stats:", error);
    return { total_cost: 0, total_revenue: 0, projected_profit: 0 };
  }

  let total_cost = 0;
  let total_revenue = 0;

  data.forEach(
    (item: {
      quantity: number | null;
      products:
        | { cost_price: number; selling_price: number }
        | { cost_price: number; selling_price: number }[]
        | null;
    }) => {
      const qty = item.quantity || 0;

      // Handle potential array response for joined relation
      const product = Array.isArray(item.products)
        ? item.products[0]
        : item.products;
      const cost = product?.cost_price || 0;
      const price = product?.selling_price || 0;

      total_cost += qty * cost;
      total_revenue += qty * price;
    }
  );

  return {
    total_cost,
    total_revenue,
    projected_profit: total_revenue - total_cost,
  };
}
