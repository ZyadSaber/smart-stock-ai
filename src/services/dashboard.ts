import { createClient } from "@/utils/supabase/server";
import { getTenantContext, applyBranchFilter } from "@/lib/tenant";

export interface DashboardStats {
  total_cost: number;
  total_revenue: number;
  projected_profit: number;
  low_stock_count: number;
  todays_profit: number;
}

export async function getDashboardStats(
  searchParams: { organization_id?: string; branch_id?: string } = {}
): Promise<DashboardStats> {
  const context = await getTenantContext();
  if (!context) {
    return {
      total_cost: 0,
      total_revenue: 0,
      projected_profit: 0,
      low_stock_count: 0,
      todays_profit: 0,
    };
  }

  const supabase = await createClient();

  // Determine effectively active filters
  let activeOrgId: string | undefined = undefined;
  let activeBranchId: string | undefined = undefined;

  if (context.isSuperAdmin) {
    activeOrgId = searchParams.organization_id;
    activeBranchId = searchParams.branch_id;
  } else {
    activeOrgId = context.organizationId || undefined;
    activeBranchId = context.branchId || undefined;
  }

  // Calculate stats from product_stocks and products
  let stocksQuery = supabase.from("product_stocks").select(`
      quantity,
      products (
        cost_price,
        selling_price
      )
    `);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      stocksQuery = stocksQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      stocksQuery = stocksQuery.in("branch_id", branchIds);
    }
  } else {
    stocksQuery = applyBranchFilter(stocksQuery, context);
  }

  const { data, error } = await stocksQuery;

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

  data.forEach((item) => {
    const qty = item.quantity || 0;

    // Type casting for joined data
    const product = (
      Array.isArray(item.products) ? item.products[0] : item.products
    ) as { cost_price: number; selling_price: number } | null;

    const cost = product?.cost_price || 0;
    const price = product?.selling_price || 0;

    total_cost += qty * cost;
    total_revenue += qty * price;
  });

  // Calculate Low Stock Alerts (< 5 items)
  let lowStockQuery = supabase
    .from("product_stocks")
    .select("*", { count: "exact", head: true })
    .lt("quantity", 5);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      lowStockQuery = lowStockQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      lowStockQuery = lowStockQuery.in("branch_id", branchIds);
    }
  } else {
    lowStockQuery = applyBranchFilter(lowStockQuery, context);
  }

  const { count: lowStockCount, error: lowStockError } = await lowStockQuery;

  if (lowStockError) {
    console.error("Error fetching low stock count:", lowStockError);
  }

  // Calculate Today's Profit
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  let salesQuery = supabase
    .from("sales")
    .select("profit_amount")
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lte("created_at", `${today}T23:59:59.999Z`);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      salesQuery = salesQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      salesQuery = salesQuery.in("branch_id", branchIds);
    }
  } else {
    salesQuery = applyBranchFilter(salesQuery, context);
  }

  const { data: todaysSales, error: salesError } = await salesQuery;

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
