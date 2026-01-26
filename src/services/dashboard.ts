import { createClient } from "@/utils/supabase/server";
import { getTenantContext, applyOrganizationFilter } from "@/lib/tenant";

export interface DashboardStats {
  total_cost: number;
  total_revenue: number;
  projected_profit: number;
  low_stock_count: number;
  todays_profit: number;
}

export async function getDashboardStats(
  searchParams: { organization_id?: string; branch_id?: string } = {},
) {
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
  let stocksQuery = supabase.from("warehouse_stock_summary").select("*");

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      stocksQuery = stocksQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      stocksQuery = stocksQuery.eq("organization_id", activeOrgId);
    }
  } else {
    stocksQuery = applyOrganizationFilter(stocksQuery, context);
    stocksQuery = stocksQuery.or(
      `branch_id.is.null,branch_id.eq.${context.branchId}`,
    );
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

  return {
    total_cost: data.reduce(
      (sum: number, po) => sum + parseFloat(po.total_stock_valuation || "0"),
      0,
    ),
    total_revenue: data.reduce(
      (sum: number, po) => sum + parseFloat(po.total_selling_value || "0"),
      0,
    ),
    projected_profit: data.reduce(
      (sum: number, po) => sum + parseFloat(po.selling_potential || "0"),
      0,
    ),
    low_stock_count: data.reduce(
      (sum: number, po) => sum + parseFloat(po.low_stock_count || "0"),
      0,
    ),
    todays_profit: data.reduce(
      (sum: number, po) => sum + parseFloat(po.todays_actual_margin || "0"),
      0,
    ),
  };
}
