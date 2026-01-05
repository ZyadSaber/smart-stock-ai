import { createClient } from "@/utils/supabase/server";
import {
  getTenantContext,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";

export async function getStockMovementsPageData(
  searchParams: { organization_id?: string; branch_id?: string } = {}
) {
  const context = await getTenantContext();
  if (!context) return null;

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

  // 1. Fetch Movements
  let movementsQuery = supabase.from("stock_movements").select(
    `
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
        `
  );

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

  const { data: movements } = await movementsQuery.order("created_at", {
    ascending: false,
  });

  // 2. Fetch products for dialogs
  let productsQuery = supabase
    .from("products")
    .select("id, name")
    .order("name");
  if (context.isSuperAdmin && activeOrgId) {
    productsQuery = productsQuery.eq("organization_id", activeOrgId);
  } else {
    productsQuery = applyOrganizationFilter(productsQuery, context);
  }
  const { data: products } = await productsQuery;

  // 3. Fetch warehouses for dialogs
  let warehousesQuery = supabase
    .from("warehouses")
    .select("id, name")
    .order("name");
  if (context.isSuperAdmin) {
    if (activeBranchId) {
      warehousesQuery = warehousesQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      warehousesQuery = warehousesQuery.in("branch_id", branchIds);
    }
  } else {
    warehousesQuery = applyOrganizationFilter(warehousesQuery, context);
    warehousesQuery = warehousesQuery.or(
      `branch_id.is.null,branch_id.eq.${context.branchId}`
    );
  }
  const { data: warehouses } = await warehousesQuery;

  return {
    movements: movements || [],
    products: products || [],
    warehouses: warehouses || [],
    context,
  };
}
