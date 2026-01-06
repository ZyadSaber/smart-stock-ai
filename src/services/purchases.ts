import { createClient } from "@/utils/supabase/server";
import {
  getTenantContext,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";

export async function getPurchasesPageData(
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

  // 1. Fetch Purchase Orders
  let purchasesQuery = supabase
    .from("purchase_orders")
    .select(
      `
    *,
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
    )
    .order("created_at", { ascending: false });

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      purchasesQuery = purchasesQuery.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      purchasesQuery = purchasesQuery.in("branch_id", branchIds);
    }
  } else {
    purchasesQuery = applyBranchFilter(purchasesQuery, context);
  }

  const { data: purchaseOrders } = await purchasesQuery.order("created_at", {
    ascending: false,
  });

  const finalPurchaseOrders = purchaseOrders?.map((po) => {
    const {
      id,
      supplier_name,
      total_amount,
      notes,
      created_at,
      user,
      purchase_order_items,
    } = po;
    return {
      id,
      supplier_name,
      total_amount,
      notes,
      created_at,
      created_by_user: user?.full_name,
      items_data: purchase_order_items,
    };
  });

  // 2. Fetch products for dialog
  let productsQuery = supabase
    .from("products")
    .select("key:id, label:name, cost_price")
    .order("name");
  if (context.isSuperAdmin && activeOrgId) {
    productsQuery = productsQuery.eq("organization_id", activeOrgId);
  } else {
    productsQuery = applyOrganizationFilter(productsQuery, context);
  }
  const { data: products } = await productsQuery;

  // 3. Fetch warehouses for dialog
  let warehousesQuery = supabase
    .from("warehouses")
    .select("key:id, label:name")
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
    warehousesQuery = applyBranchFilter(warehousesQuery, context);
  }
  const { data: warehouses } = await warehousesQuery;

  return {
    purchaseOrders: finalPurchaseOrders || [],
    products: products || [],
    warehouses: warehouses || [],
  };
}
