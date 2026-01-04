import { createClient } from "@/utils/supabase/server";
import {
  getTenantContext,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";

import { getOrganizationsWithBranches } from "@/app/(dashboard)/users/actions";

export interface WarehouseWithStats {
  id: string;
  name: string;
  location: string | null;
  totalItems: number;
  totalQuantity: number;
}

export interface ProductWithStock {
  id: string;
  name: string;
  barcode: string | null;
}

export async function getWarehousePageData(searchParams: {
  organization_id?: string;
  branch_id?: string;
}) {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  // Determine effectively active filters
  // For Super Admins: we ONLY use searchParams. If missing, they see everything.
  // For Regular Users: we use their profile-fixed IDs.
  let activeOrgId: string | undefined = undefined;
  let activeBranchId: string | undefined = undefined;

  if (context.isSuperAdmin) {
    activeOrgId = searchParams.organization_id;
    activeBranchId = searchParams.branch_id;
  } else {
    activeOrgId = context.organizationId || undefined;
    activeBranchId = context.branchId || undefined;
  }

  // Fetch organizations list if super admin
  const organizations = context.isSuperAdmin
    ? await getOrganizationsWithBranches()
    : [];

  // 1. Fetch warehouses
  let warehousesQuery = supabase
    .from("warehouses")
    .select("id, name, location, branch_id")
    .order("name");

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      warehousesQuery = warehousesQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const org = organizations.find((o) => o.id === activeOrgId);
      const branchIds = org?.branches?.map((b) => b.id) || [];
      warehousesQuery = warehousesQuery.in("branch_id", branchIds);
    }
  } else {
    warehousesQuery = applyBranchFilter(warehousesQuery, context);
  }
  const { data: warehousesData } = await warehousesQuery;
  const warehouses = warehousesData || [];

  // 2. Fetch products
  let productsQuery = supabase
    .from("products")
    .select("id, name, barcode, organization_id")
    .order("name");

  if (context.isSuperAdmin && activeOrgId) {
    productsQuery = productsQuery.eq("organization_id", activeOrgId);
  } else {
    productsQuery = applyOrganizationFilter(productsQuery, context);
  }
  const { data: productsData } = await productsQuery;
  const products = productsData || [];

  // 3. Fetch stock data
  let stocksQuery = supabase
    .from("product_stocks")
    .select("product_id, warehouse_id, quantity, branch_id");

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      stocksQuery = stocksQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const org = organizations.find((o) => o.id === activeOrgId);
      const branchIds = org?.branches?.map((b) => b.id) || [];
      stocksQuery = stocksQuery.in("branch_id", branchIds);
    }
  } else {
    stocksQuery = applyBranchFilter(stocksQuery, context);
  }
  const { data: stocksData } = await stocksQuery;
  const stocks = stocksData || [];

  // 4. Create a map for quick stock lookup
  const stockMap = new Map<string, number>();
  stocks.forEach((stock) => {
    const key = `${stock.product_id}-${stock.warehouse_id}`;
    stockMap.set(key, stock.quantity);
  });

  // 5. Calculate totals for each warehouse
  const warehouseTotals = warehouses.map((warehouse) => {
    const warehouseStocks = stocks.filter(
      (s) => s.warehouse_id === warehouse.id
    );
    const totalItems = warehouseStocks.length;
    const totalQuantity = warehouseStocks.reduce(
      (sum, s) => sum + s.quantity,
      0
    );
    return {
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
      totalItems,
      totalQuantity,
    } as WarehouseWithStats;
  });

  // 6. Fetch stock movements to identify "locked" stocks
  let movementsQuery = supabase
    .from("stock_movements")
    .select("product_id, from_warehouse_id, to_warehouse_id");

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      movementsQuery = movementsQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const org = organizations.find((o) => o.id === activeOrgId);
      const branchIds = org?.branches?.map((b) => b.id) || [];
      movementsQuery = movementsQuery.in("branch_id", branchIds);
    }
  } else {
    movementsQuery = applyBranchFilter(movementsQuery, context);
  }

  const { data: movementsData } = await movementsQuery;
  const lockedStocks = new Set<string>();

  (movementsData || []).forEach((m) => {
    if (m.from_warehouse_id)
      lockedStocks.add(`${m.product_id}-${m.from_warehouse_id}`);
    if (m.to_warehouse_id)
      lockedStocks.add(`${m.product_id}-${m.to_warehouse_id}`);
  });

  return {
    context,
    organizations,
    warehouses,
    products,
    stockMap,
    warehouseTotals,
    activeOrgId,
    activeBranchId,
    lockedStocks,
  };
}
