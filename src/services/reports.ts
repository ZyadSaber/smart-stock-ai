"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getTenantContext,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";
import { Sale } from "@/types/sales";
import { isToday, isYesterday, subDays, isAfter, parseISO } from "date-fns";

export interface SalesReportFilters {
  dateFrom?: string;
  dateTo?: string;
  customer_id?: string;
  organization_id?: string;
  branch_id?: string;
}

export async function getSalesReportAction(filters: SalesReportFilters) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  // Determine effectively active filters for Super Admin
  let activeOrgId: string | undefined = undefined;
  let activeBranchId: string | undefined = undefined;

  if (context.isSuperAdmin) {
    activeOrgId = filters.organization_id;
    activeBranchId = filters.branch_id;
  } else {
    activeOrgId = context.organizationId || undefined;
    activeBranchId = context.branchId || undefined;
  }

  let salesQuery = supabase.from("sales").select(
    `
          id,
          customer_id,
          customer: customers (
            name
          ),
          notes,
          total_amount,
          profit_amount,
          created_at,
          user_id,
          branch_id,
          branch:branches (
            name,
            organization:organizations (
              name
            )
          ),
          user:profiles (
            full_name
          ),
          sale_items (
            id,
            quantity,
            unit_price,
            product_id,
            warehouse_id,
            products (
              name,
              barcode
            ),
            warehouses (
              name
            )
          )
      `
  );

  // Apply basic tenant filters
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

  // Apply report specific filters
  if (filters.customer_id) {
    salesQuery = salesQuery.eq("customer_id", filters.customer_id);
  }

  if (filters.dateFrom) {
    salesQuery = salesQuery.gte("created_at", filters.dateFrom);
  }

  if (filters.dateTo) {
    // Adjust dateTo to include the full day
    const endDate = new Date(filters.dateTo);
    endDate.setHours(23, 59, 59, 999);
    salesQuery = salesQuery.lte("created_at", endDate.toISOString());
  }

  const { data: sales, error } = await salesQuery.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("Sales Report Fetch Error:", error);
    return { error: "Failed to fetch sales report data" };
  }

  const finalSales = sales?.map((po) => {
    const {
      profit_amount,
      user_id,
      id,
      customer_id,
      total_amount,
      notes,
      created_at,
      user,
      sale_items,
      customer,
      branch,
      branch_id,
    } = po;

    const branchData = Array.isArray(branch) ? branch[0] : branch;
    const organizationData = Array.isArray(branchData?.organization)
      ? branchData.organization[0]
      : branchData?.organization;

    return {
      id,
      customer_id,
      customer_name: (Array.isArray(customer) ? customer[0] : customer)?.name,
      total_amount,
      notes,
      created_at,
      created_by_user:
        (Array.isArray(user) ? user[0] : user)?.full_name || "System",
      items_data: sale_items?.map((item: Record<string, unknown>) => ({
        ...item,
        sale_id: id,
      })),
      profit_amount,
      user_id,
      branch_id,
      branch_name: branchData?.name || "",
      organization_name: organizationData?.name || "",
    } as unknown as Sale;
  });

  return { data: finalSales || [] };
}

export async function getReportMetadata(
  searchParams: { organization_id?: string; branch_id?: string } = {}
) {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  let activeOrgId: string | undefined = undefined;
  if (context.isSuperAdmin) {
    activeOrgId = searchParams.organization_id;
  } else {
    activeOrgId = context.organizationId || undefined;
  }

  let customersQuery = supabase
    .from("customers")
    .select("key:id, label:name")
    .order("name");

  if (context.isSuperAdmin && activeOrgId) {
    customersQuery = customersQuery.eq("organization_id", activeOrgId);
  } else {
    customersQuery = applyOrganizationFilter(customersQuery, context);
  }

  const { data: customers } = await customersQuery;

  return {
    customers: customers || [],
  };
}

export async function getSalesReportCardsData(filters: SalesReportFilters) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  let activeOrgId: string | undefined = undefined;
  let activeBranchId: string | undefined = undefined;

  if (context.isSuperAdmin) {
    activeOrgId = filters.organization_id;
    activeBranchId = filters.branch_id;
  } else {
    activeOrgId = context.organizationId || undefined;
    activeBranchId = context.branchId || undefined;
  }

  let query = supabase
    .from("sales")
    .select("total_amount, profit_amount, created_at");

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      query = query.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      query = query.in("branch_id", branchIds);
    }
  } else {
    query = applyBranchFilter(query, context);
  }

  if (filters.customer_id) query = query.eq("customer_id", filters.customer_id);

  const { data: sales, error } = await query;

  if (error) {
    console.error("Sales Report Cards Error:", error);
    return { error: "Failed to fetch card data" };
  }

  // Summary logic (overall for the selected filters)
  const summary = sales.reduce(
    (acc, sale) => ({
      totalSales: acc.totalSales + 1,
      totalRevenue: acc.totalRevenue + Number(sale.total_amount),
      totalProfit: acc.totalProfit + Number(sale.profit_amount),
    }),
    { totalSales: 0, totalRevenue: 0, totalProfit: 0 }
  );

  const now = new Date();
  const fifteenDaysAgo = subDays(now, 15);
  const thirtyDaysAgo = subDays(now, 30);

  // Invoice Frequency logic
  const stats = {
    today: sales.filter((s) => isToday(parseISO(s.created_at))).length,
    yesterday: sales.filter((s) => isYesterday(parseISO(s.created_at))).length,
    last15Days: sales.filter((s) =>
      isAfter(parseISO(s.created_at), fifteenDaysAgo)
    ).length,
    last30Days: sales.filter((s) =>
      isAfter(parseISO(s.created_at), thirtyDaysAgo)
    ).length,
  };

  // Logic for placeholders or additional metrics
  const additionalMetrics = {
    avgInvoiceValue:
      summary.totalSales > 0 ? summary.totalRevenue / summary.totalSales : 0,
    profitMargin:
      summary.totalRevenue > 0
        ? (summary.totalProfit / summary.totalRevenue) * 100
        : 0,
  };

  return { data: { summary, stats, additionalMetrics } };
}
