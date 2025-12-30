import { createClient } from "@/utils/supabase/server";

export interface DashboardStats {
  total_cost: number;
  total_revenue: number;
  projected_profit: number;
  low_stock_count: number;
  todays_profit: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
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
    return {
      total_cost: 0,
      total_revenue: 0,
      projected_profit: 0,
      low_stock_count: 0,
      todays_profit: 0,
    };
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

  // Calculate Low Stock Alerts (< 5 items)
  const { count: lowStockCount, error: lowStockError } = await supabase
    .from("product_stocks")
    .select("*", { count: "exact", head: true })
    .lt("quantity", 5);

  if (lowStockError) {
    console.error("Error fetching low stock count:", lowStockError);
  }

  // Calculate Today's Profit
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const { data: todaysSales, error: salesError } = await supabase
    .from("sales")
    .select("profit_amount")
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lte("created_at", `${today}T23:59:59.999Z`);

  let todaysProfit = 0;
  if (!salesError && todaysSales) {
    todaysSales.forEach((sale) => {
      todaysProfit += Number(sale.profit_amount) || 0;
    });
  }

  return {
    total_cost,
    total_revenue,
    projected_profit: total_revenue - total_cost,
    low_stock_count: lowStockCount || 0,
    todays_profit: todaysProfit,
  };
}
