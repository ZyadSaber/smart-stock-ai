"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getTenantContext,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";
import { Sale } from "@/types/sales";

import {
  SalesReportFilters,
  PurchaseReportFilters,
  StockReportFilters,
} from "@/types/reports";

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

  const { data: stats, error: statsError } = await supabase
    .rpc("get_branch_sales_stats", {
      p_branch_id: activeBranchId,
      p_customer_id: filters.customer_id || null,
      p_from_date: filters.dateFrom || null,
      p_to_date: filters.dateTo || null,
    })
    .single();

  if (statsError) {
    console.error("Sales Stats Error:", statsError);
    return { error: statsError.message };
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
      `,
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

  return {
    data: {
      filtered_stats: stats,
      sales: finalSales || [],
    },
  };
}

export async function getReportsPageMetadata(
  searchParams: { organization_id?: string; branch_id?: string } = {},
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

  // Customers Query
  let customersQuery = supabase
    .from("customers")
    .select("key:id, label:name")
    .order("name");

  // Suppliers Query
  let suppliersQuery = supabase
    .from("suppliers")
    .select("key:id, label:name")
    .order("name");

  // Products Query
  let productsQuery = supabase
    .from("products")
    .select("key:id, label:name")
    .order("name");

  // Warehouses Query
  let warehousesQuery = supabase
    .from("warehouses")
    .select("key:id, label:name")
    .order("name");

  if (context.isSuperAdmin && activeOrgId) {
    customersQuery = customersQuery.eq("organization_id", activeOrgId);
    suppliersQuery = suppliersQuery.eq("organization_id", activeOrgId);
    productsQuery = productsQuery.eq("organization_id", activeOrgId);

    // For warehouses we need branches
    const { data: orgBranches } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", activeOrgId);
    const branchIds = orgBranches?.map((b) => b.id) || [];
    warehousesQuery = warehousesQuery.in("branch_id", branchIds);
  } else {
    customersQuery = applyOrganizationFilter(customersQuery, context);
    suppliersQuery = applyOrganizationFilter(suppliersQuery, context);
    productsQuery = applyOrganizationFilter(productsQuery, context);
    warehousesQuery = applyBranchFilter(warehousesQuery, context);
  }

  const [
    { data: customers },
    { data: suppliers },
    { data: products },
    { data: warehouses },
  ] = await Promise.all([
    customersQuery,
    suppliersQuery,
    productsQuery,
    warehousesQuery,
  ]);

  return {
    customers: customers || [],
    suppliers: suppliers || [],
    products: products || [],
    warehouses: warehouses || [],
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

  const { data: stats, error } = await supabase
    .rpc("get_branch_sales_stats", {
      p_branch_id: activeBranchId,
    })
    .single();

  if (error) {
    console.error("Sales Stats Error:", error);
    return { error: error.message };
  }

  // 1. Fetch Stock Data
  const topSellingCustomers = supabase
    .from("view_top_selling_customers")
    .select(`*`)
    .limit(5)
    .eq("branch_id", activeBranchId || null)
    .eq("organization_id", activeOrgId || null);

  const { data: topSellingCustomersData, error: topSellingCustomersError } =
    await topSellingCustomers;

  if (topSellingCustomersError) {
    console.error("Top Selling Customers Error:", topSellingCustomersError);
    return { error: topSellingCustomersError.message };
  }

  return {
    data: {
      ...(stats || {}),
      topSellingCustomers: topSellingCustomersData || [],
    },
  };
}

export async function getPurchaseReportAction(filters: PurchaseReportFilters) {
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

  let query = supabase.from("purchase_orders").select(
    `
    *,
    supplier:suppliers (
        name
    ),
    user:profiles (
        full_name
    ),
    purchase_order_items (
      id,
      quantity,
      unit_price,
      total_price,
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
  `,
  );

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

  if (filters.supplier_id) query = query.eq("supplier_id", filters.supplier_id);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) {
    const endDate = new Date(filters.dateTo);
    endDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", endDate.toISOString());
  }

  const { data: purchases, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("Purchase Report Fetch Error:", error);
    return { error: "Failed to fetch purchase report data" };
  }

  const finalPurchases = purchases?.map((po) => {
    const {
      id,
      supplier_id,
      total_amount,
      notes,
      created_at,
      user,
      purchase_order_items,
      supplier,
    } = po;
    return {
      id,
      supplier_id,
      supplier_name: (Array.isArray(supplier) ? supplier[0] : supplier)?.name,
      total_amount,
      notes,
      created_at,
      created_by_user:
        (Array.isArray(user) ? user[0] : user)?.full_name || "System",
      items_data: purchase_order_items,
    };
  });

  return {
    data: {
      purchases: finalPurchases || [],
      filterd_stats: {
        total_purchases: finalPurchases?.length || 0,
        total_amount:
          +finalPurchases?.reduce((acc, po) => +acc + +po.total_amount, 0) || 0,
      },
    },
  };
}

export async function getPurchaseReportCardsData(
  filters: PurchaseReportFilters,
) {
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

  const { data: stats, error } = await supabase
    .rpc("get_branch_purchase_stats", {
      p_branch_id: activeBranchId,
    })
    .single();

  if (error) {
    console.error("Sales Stats Error:", error);
    return { error: error.message };
  }

  const topPurchaseSuppliers = supabase
    .from("view_top_suppliers_by_purchases")
    .select(`*`)
    .limit(5)
    .eq("branch_id", activeBranchId || null)
    .eq("organization_id", activeOrgId || null);

  const { data: topPurchaseSuppliersData, error: topPurchaseSuppliersError } =
    await topPurchaseSuppliers;

  if (topPurchaseSuppliersError) {
    console.error("Top Purchase Suppliers Error:", topPurchaseSuppliersError);
    return { error: topPurchaseSuppliersError.message };
  }

  return {
    data: {
      ...(stats || {}),
      topPurchaseSuppliers: topPurchaseSuppliersData || [],
    },
  };
}

export async function getStockReportAction(filters: StockReportFilters) {
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

  // 1. Fetch Stock Data
  let stockQuery = supabase
    .from("view_product_stock_valuation")
    .select(`*`)
    .order("warehouse_id", { ascending: true })
    .order("stock_level", { ascending: false });

  if (activeBranchId) {
    // Show warehouses belonging to the selected branch OR warehouses with no branch (global)
    stockQuery = stockQuery.or(
      `branch_id.eq.${activeBranchId},branch_id.is.null`,
    );
  }

  if (activeOrgId) {
    // Always filter by organization to maintain multi-tenancy boundaries
    stockQuery = stockQuery.eq("organization_id", activeOrgId);
  }

  if (filters.product_id)
    stockQuery = stockQuery.eq("product_id", filters.product_id);
  if (filters.warehouse_id)
    stockQuery = stockQuery.eq("warehouse_id", filters.warehouse_id);

  const { data: stocks, error: stockError } = await stockQuery;

  if (stockError) {
    console.error("Stock Report Error:", stockError);
    return { error: "Failed to fetch stock data" };
  }

  // 2. Fetch Stock Movements
  let movementsQuery = supabase
    .from("view_stock_movements_detailed")
    .select("*");

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      movementsQuery = movementsQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      movementsQuery = movementsQuery.in("branch_id", branchIds);
    }
  } else {
    movementsQuery = applyBranchFilter(movementsQuery, context);
  }

  if (filters.product_id)
    movementsQuery = movementsQuery.eq("product_id", filters.product_id);

  const { data: movements, error: moveError } = await movementsQuery.order(
    "created_at",
    { ascending: false },
  );

  if (moveError) {
    console.error("Stock Movements Error:", moveError);
    return { error: "Failed to fetch stock movements" };
  }

  // 3. Fetch Sales History
  let salesHistoryQuery = supabase
    .from("view_latest_sellin_products")
    .select("*");

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      salesHistoryQuery = salesHistoryQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      salesHistoryQuery = salesHistoryQuery.in("branch_id", branchIds);
    }
  } else {
    salesHistoryQuery = applyBranchFilter(salesHistoryQuery, context);
  }

  if (filters.product_id)
    salesHistoryQuery = salesHistoryQuery.eq("product_id", filters.product_id);

  const { data: salesHistory, error: salesError } = await salesHistoryQuery;
  if (salesError) {
    console.error("Failed to fetch sales history", salesError);
    return { error: "Failed to fetch sales history" };
  }

  return {
    data: {
      stocks: stocks || [],
      movements: movements || [],
      salesHistory: salesHistory || [],
    },
  };
}

export async function getStockReportCardsData(filters: StockReportFilters) {
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

  // 1. Fetch Global Stock Info for Cards (Filtered only by tenant)
  let baseProductStockQuery = supabase
    .from("warehouse_stock_summary")
    .select("*");

  if (activeBranchId) {
    // Show warehouses belonging to the selected branch OR warehouses with no branch (global)
    baseProductStockQuery = baseProductStockQuery.or(
      `branch_id.eq.${activeBranchId},branch_id.is.null`,
    );
  }

  if (activeOrgId) {
    // Always filter by organization to maintain multi-tenancy boundaries
    baseProductStockQuery = baseProductStockQuery.eq(
      "organization_id",
      activeOrgId,
    );
  }

  const { data: allProductStocks } = await baseProductStockQuery;

  // Process Card 2 (Top Item per Warehouse)
  let topSellinProducts = supabase.rpc("get_top_product_per_warehouse");

  if (activeBranchId) {
    // Show warehouses belonging to the selected branch OR warehouses with no branch (global)
    topSellinProducts = topSellinProducts.or(
      `branch_id.eq.${activeBranchId},branch_id.is.null`,
    );
  }

  if (activeOrgId) {
    // Always filter by organization to maintain multi-tenancy boundaries
    topSellinProducts = topSellinProducts.eq("organization_id", activeOrgId);
  }

  const { data: topSellinProductsData, error: topSellingProductsError } =
    await topSellinProducts;
  console.error(topSellingProductsError);

  // Process Card 3 (Low Stock Items)
  let lowStockItemsQyery = supabase
    .from("view_product_stock_valuation")
    .select("*")
    .lt("stock_level", 5)
    .order("stock_level", { ascending: true });

  if (activeBranchId) {
    // Show warehouses belonging to the selected branch OR warehouses with no branch (global)
    lowStockItemsQyery = lowStockItemsQyery.or(
      `branch_id.eq.${activeBranchId},branch_id.is.null`,
    );
  }

  if (activeOrgId) {
    // Always filter by organization to maintain multi-tenancy boundaries
    lowStockItemsQyery = lowStockItemsQyery.eq("organization_id", activeOrgId);
  }

  const { data: lowStockProducts } = await lowStockItemsQyery;

  // Process Card 4 (Latest 6 Sold Items)
  let salesQuery = supabase
    .from("view_latest_sellin_products")
    .select(
      `
        quantity,
        unit_price,
        product_name,
        created_at
  `,
    )
    .limit(6);

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
    salesQuery = salesQuery.eq("branch_id", context.branchId);
  }

  const { data: latestSales, error: latestSalesError } = await salesQuery;

  console.error(latestSalesError);

  return {
    data: {
      warehouseStats: allProductStocks,
      topItems: topSellinProductsData,
      lowStock: lowStockProducts || [],
      latestSales: latestSales || [],
    },
  };
}
