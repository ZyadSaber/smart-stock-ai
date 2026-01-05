import { createClient } from "@/utils/supabase/server";
import { getTenantContext, applyOrganizationFilter } from "@/lib/tenant";

import { getOrganizationsWithBranches } from "@/app/(dashboard)/users/actions";

export interface WarehouseWithStats {
  id: string;
  name: string;
  location: string | null;
  branch_id: string | null;
  items_quantity: number;
  total_products: number;
}

export interface ProductWithStock {
  id: string;
  name: string;
  barcode: string | null;
  has_movement: boolean;
}

export async function getWarehousePageData(searchParams: {
  organization_id?: string;
  branch_id?: string;
}) {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

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
    .from("warehouse_stock_summary")
    .select(
      `
      id, 
      name, 
      location, 
      branch_id, 
      total_products,
      items_quantity
      `
    )
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
    warehousesQuery = applyOrganizationFilter(warehousesQuery, context);
    warehousesQuery = warehousesQuery.or(
      `branch_id.is.null,branch_id.eq.${context.branchId}`
    );
  }
  const { data: warehousesData } = await warehousesQuery;
  const warehouses = warehousesData || [];

  // 2. Fetch products
  let productsQuery = supabase
    .from("products")
    .select("id, name, barcode, organization_id, stock_movements (id)")
    .limit(1, { foreignTable: "stock_movements" })
    .order("name");

  if (context.isSuperAdmin && activeOrgId) {
    productsQuery = productsQuery.eq("organization_id", activeOrgId);
  } else {
    productsQuery = applyOrganizationFilter(productsQuery, context);
  }
  const { data: productsData } = await productsQuery;
  const products = (productsData || []).map((product) => ({
    ...product,
    has_movement: product.stock_movements.length > 0,
  }));

  const warehouseIds = warehouses.map((w) => w.id);

  // 3. Fetch stock data
  const stocksQuery = supabase
    .from("product_stocks")
    .select("product_id, warehouse_id, quantity, branch_id")
    .in("warehouse_id", warehouseIds);

  const { data: stocksData } = await stocksQuery;
  const stocks = stocksData || [];

  // 4. Create a map for quick stock lookup
  const stockMap = new Map<string, number>();
  stocks.forEach((stock) => {
    const key = `${stock.product_id}-${stock.warehouse_id}`;
    stockMap.set(key, stock.quantity);
  });

  return {
    warehouses,
    products,
    stockMap,
  };
}
