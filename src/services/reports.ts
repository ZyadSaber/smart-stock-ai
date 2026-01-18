"use server";

import { createClient } from "@/utils/supabase/server";
import {
  getTenantContext,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";
import { Sale } from "@/types/sales";
import { isToday, isYesterday, subDays, isAfter, parseISO } from "date-fns";

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

export async function getReportsPageMetadata(
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
  `
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

  return { data: finalPurchases || [] };
}

export async function getPurchaseReportCardsData(
  filters: PurchaseReportFilters
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

  let query = supabase.from("purchase_orders").select(`
    total_amount, 
    created_at,
    supplier_id,
    supplier:suppliers(name),
    purchase_order_items(id)
  `);

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

  const { data: purchases, error } = await query;

  if (error) {
    console.error("Purchase Report Cards Error:", error);
    return { error: "Failed to fetch card data" };
  }

  const supplierCounts: Record<string, { count: number; name: string }> = {};
  let totalItemsCount = 0;

  const summary = purchases.reduce(
    (acc, p) => {
      // Top supplier tracking
      const sName =
        (Array.isArray(p.supplier) ? p.supplier[0] : p.supplier)?.name ||
        "Unknown";
      if (!supplierCounts[p.supplier_id]) {
        supplierCounts[p.supplier_id] = { count: 0, name: sName };
      }
      supplierCounts[p.supplier_id].count++;

      // Items count for average
      totalItemsCount += p.purchase_order_items?.length || 0;

      return {
        totalPurchases: acc.totalPurchases + 1,
        totalSpending: acc.totalSpending + Number(p.total_amount),
      };
    },
    { totalPurchases: 0, totalSpending: 0 }
  );

  const supplierKeys = Object.keys(supplierCounts);
  const topSupplierId =
    supplierKeys.length > 0
      ? supplierKeys.reduce((a, b) =>
          supplierCounts[a].count > supplierCounts[b].count ? a : b
        )
      : "";
  const topSupplierName = topSupplierId
    ? supplierCounts[topSupplierId].name
    : "N/A";

  const now = new Date();
  const fifteenDaysAgo = subDays(now, 15);
  const thirtyDaysAgo = subDays(now, 30);

  const stats = {
    today: purchases.filter((p) => isToday(parseISO(p.created_at))).length,
    yesterday: purchases.filter((p) => isYesterday(parseISO(p.created_at)))
      .length,
    last15Days: purchases.filter((p) =>
      isAfter(parseISO(p.created_at), fifteenDaysAgo)
    ).length,
    last30Days: purchases.filter((p) =>
      isAfter(parseISO(p.created_at), thirtyDaysAgo)
    ).length,
  };

  const additionalMetrics = {
    avgPurchaseValue:
      summary.totalPurchases > 0
        ? summary.totalSpending / summary.totalPurchases
        : 0,
    avgItemsPerInvoice:
      summary.totalPurchases > 0 ? totalItemsCount / summary.totalPurchases : 0,
    topSupplier: topSupplierName,
  };

  return { data: { summary, stats, additionalMetrics } };
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
  let stockQuery = supabase.from("product_stocks").select(`
    id,
    quantity,
    product_id,
    warehouse_id,
    products (name, barcode, cost_price),
    warehouses (name)
  `);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      stockQuery = stockQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      stockQuery = stockQuery.in("branch_id", branchIds);
    }
  } else {
    stockQuery = applyBranchFilter(stockQuery, context);
  }

  if (filters.product_id)
    stockQuery = stockQuery.eq("product_id", filters.product_id);
  if (filters.warehouse_id)
    stockQuery = stockQuery.eq("warehouse_id", filters.warehouse_id);

  const { data: stocks, error: stockError } = await stockQuery;
  if (stockError) return { error: "Failed to fetch stock data" };

  // 2. Fetch Stock Movements
  let movementsQuery = supabase.from("stock_movements").select(`
    id,
    quantity,
    notes,
    created_at,
    product_id,
    from_warehouse_id,
    to_warehouse_id,
    products (name, barcode),
    from_warehouse:warehouses!stock_movements_from_warehouse_id_fkey (name),
    to_warehouse:warehouses!stock_movements_to_warehouse_id_fkey (name),
    created_by_user:profiles!stock_movements_created_by_profiles_fkey (full_name)
  `);

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

  const { data: movements, error: moveError } = await movementsQuery
    .order("created_at", { ascending: false })
    .limit(20);
  if (moveError) return { error: "Failed to fetch stock movements" };

  // 3. Fetch Sales History
  let salesHistoryQuery = supabase.from("sale_items").select(`
    id,
    quantity,
    unit_price,
    products (name, barcode, cost_price),
    sales!inner (created_at)
  `);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      salesHistoryQuery = salesHistoryQuery.eq(
        "sales.branch_id",
        activeBranchId
      );
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      salesHistoryQuery = salesHistoryQuery.in("sales.branch_id", branchIds);
    }
  } else {
    salesHistoryQuery = salesHistoryQuery.eq(
      "sales.branch_id",
      context.branchId
    );
  }

  if (filters.product_id)
    salesHistoryQuery = salesHistoryQuery.eq("product_id", filters.product_id);

  const { data: salesHistory, error: salesError } = await salesHistoryQuery
    .order("created_at", { foreignTable: "sales", ascending: false })
    .limit(50);
  if (salesError) return { error: "Failed to fetch sales history" };

  interface StockRaw {
    id: string;
    quantity: number;
    product_id: string;
    warehouse_id: string;
    products:
      | { name: string; barcode: string; cost_price: number }
      | { name: string; barcode: string; cost_price: number }[];
    warehouses: { name: string } | { name: string }[];
  }

  interface MovementRaw {
    id: string;
    quantity: number;
    notes: string;
    created_at: string;
    from_warehouse_id: string;
    to_warehouse_id: string;
    products:
      | { name: string; barcode: string }
      | { name: string; barcode: string }[];
    from_warehouse: { name: string } | { name: string }[];
    to_warehouse: { name: string } | { name: string }[];
  }

  interface SalesHistoryRaw {
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    products:
      | { name: string; barcode: string; cost_price: number }
      | { name: string; barcode: string; cost_price: number }[];
    sales: { created_at: string } | { created_at: string }[];
  }

  return {
    data: {
      stocks: ((stocks as unknown as StockRaw[]) || []).map((s) => ({
        ...s,
        products: Array.isArray(s.products) ? s.products[0] : s.products,
        warehouses: Array.isArray(s.warehouses)
          ? s.warehouses[0]
          : s.warehouses,
      })),
      movements: ((movements as unknown as MovementRaw[]) || []).map((m) => ({
        ...m,
        products: Array.isArray(m.products) ? m.products[0] : m.products,
        from_warehouse: Array.isArray(m.from_warehouse)
          ? m.from_warehouse[0]
          : m.from_warehouse,
        to_warehouse: Array.isArray(m.to_warehouse)
          ? m.to_warehouse[0]
          : m.to_warehouse,
      })),
      salesHistory: ((salesHistory as unknown as SalesHistoryRaw[]) || []).map(
        (s) => {
          const p = Array.isArray(s.products) ? s.products[0] : s.products;
          const sale = Array.isArray(s.sales) ? s.sales[0] : s.sales;
          const costPrice = Number(p?.cost_price || 0);
          const sellPrice = Number(s.unit_price || 0);
          const qty = Number(s.quantity || 0);

          return {
            ...s,
            product_name: p?.name,
            product_barcode: p?.barcode,
            cost_price: costPrice,
            total_cost: costPrice * qty,
            total_sale: sellPrice * qty,
            profit: (sellPrice - costPrice) * qty,
            created_at: sale?.created_at,
          };
        }
      ),
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
  let baseQuery = supabase.from("product_stocks").select(`
    quantity,
    product_id,
    warehouse_id,
    products (name, cost_price),
    warehouses (name)
  `);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      baseQuery = baseQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      baseQuery = baseQuery.in("branch_id", branchIds);
    }
  } else {
    baseQuery = applyBranchFilter(baseQuery, context);
  }

  const { data: allStocks } = await baseQuery;

  interface StockWithRelations {
    quantity: number;
    product_id: string;
    warehouse_id: string;
    products:
      | { name: string; cost_price: number }
      | { name: string; cost_price: number }[];
    warehouses: { name: string } | { name: string }[];
  }

  const stocksWithRelations =
    (allStocks as unknown as StockWithRelations[]) || [];

  // Process Card 1 (Current Stock/Value per Warehouse)
  const warehouseStats: Record<
    string,
    { quantity: number; value: number; name: string }
  > = {};
  stocksWithRelations.forEach((s) => {
    const wName =
      (Array.isArray(s.warehouses) ? s.warehouses[0] : s.warehouses)?.name ||
      "Default";
    const pCost =
      (Array.isArray(s.products) ? s.products[0] : s.products)?.cost_price || 0;

    if (!warehouseStats[s.warehouse_id]) {
      warehouseStats[s.warehouse_id] = { quantity: 0, value: 0, name: wName };
    }
    warehouseStats[s.warehouse_id].quantity += s.quantity;
    warehouseStats[s.warehouse_id].value += s.quantity * Number(pCost);
  });

  // Process Card 2 & 3 (Top 2 Items and Low Stock Items per Warehouse)
  const warehouseItems: Record<string, { name: string; quantity: number }[]> =
    {};
  stocksWithRelations.forEach((s) => {
    const pName =
      (Array.isArray(s.products) ? s.products[0] : s.products)?.name ||
      "Unknown";
    if (!warehouseItems[s.warehouse_id]) warehouseItems[s.warehouse_id] = [];
    warehouseItems[s.warehouse_id].push({
      name: pName,
      quantity: s.quantity,
    });
  });

  const topItemsPerWarehouse = Object.entries(warehouseItems).map(
    ([id, items]) => ({
      warehouseName: warehouseStats[id].name,
      items: items.sort((a, b) => b.quantity - a.quantity).slice(0, 2),
    })
  );

  const lowStockItems = stocksWithRelations
    .filter((s) => s.quantity < 5)
    .map((s) => ({
      name:
        (Array.isArray(s.products) ? s.products[0] : s.products)?.name ||
        "Unknown",
      quantity: s.quantity,
      warehouse:
        (Array.isArray(s.warehouses) ? s.warehouses[0] : s.warehouses)?.name ||
        "Default",
    }))
    .slice(0, 10);

  // Process Card 4 (Latest 6 Sold Items)
  let salesQuery = supabase
    .from("sale_items")
    .select(
      `
    quantity,
    unit_price,
    products (name),
    sales!inner (created_at)
  `
    )
    .order("created_at", { foreignTable: "sales", ascending: false })
    .limit(6);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      salesQuery = salesQuery.eq("sales.branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      salesQuery = salesQuery.in("sales.branch_id", branchIds);
    }
  } else {
    salesQuery = salesQuery.eq("sales.branch_id", context.branchId);
  }

  const { data: latestSales } = await salesQuery;

  interface SaleData {
    quantity: number;
    products: { name: string } | { name: string }[];
    sales: { created_at: string } | { created_at: string }[];
  }

  const finalSales = (latestSales as unknown as SaleData[]) || [];

  return {
    data: {
      warehouseStats: Object.values(warehouseStats),
      topItems: topItemsPerWarehouse,
      lowStock: lowStockItems || [],
      latestSales: finalSales.map((s) => ({
        name:
          (Array.isArray(s.products) ? s.products[0] : s.products)?.name ||
          "Unknown",
        quantity: s.quantity,
        time: (Array.isArray(s.sales) ? s.sales[0] : s.sales)?.created_at,
      })),
    },
  };
}
