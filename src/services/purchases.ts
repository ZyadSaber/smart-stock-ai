"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  getTenantContext,
  applyBranchFilter,
  applyOrganizationFilter,
  getBranchDefaults,
} from "@/lib/tenant";
import {
  purchaseOrderSchema,
  type PurchaseOrderFormInput,
} from "@/lib/validations/purchase-order";
import {
  PurchaseOrder,
  PurchaseProduct,
  Warehouse,
  Supplier,
} from "@/types/purchases";

export async function getPurchasesPageData(
  searchParams: {
    organization_id?: string;
    branch_id?: string;
    date_from?: string;
    date_to?: string;
    supplier_id?: string;
    notes?: string;
  } = {},
): Promise<{
  data?: {
    purchaseOrders: PurchaseOrder[];
    products: PurchaseProduct[];
    warehouses: Warehouse[];
    suppliers: Supplier[];
  };
  error?: string;
}> {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

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

  if (searchParams.date_from) {
    purchasesQuery = purchasesQuery.gte("created_at", searchParams.date_from);
  }
  if (searchParams.date_to) {
    const endDate = new Date(searchParams.date_to);
    endDate.setHours(23, 59, 59, 999);
    purchasesQuery = purchasesQuery.lte("created_at", endDate.toISOString());
  }
  if (searchParams.supplier_id && searchParams.supplier_id !== "all") {
    purchasesQuery = purchasesQuery.eq("supplier_id", searchParams.supplier_id);
  }
  if (searchParams.notes) {
    purchasesQuery = purchasesQuery.ilike("notes", `%${searchParams.notes}%`);
  }

  const { data: purchaseOrders } = await purchasesQuery.order("created_at", {
    ascending: false,
  });

  const finalPurchaseOrders = purchaseOrders?.map((po) => {
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
      created_by_user: (Array.isArray(user) ? user[0] : user)?.full_name,
      items_data: purchase_order_items,
    };
  });

  // 2. Fetch products for dialog
  let productsQuery = supabase
    .from("products")
    .select("key:id, label:name, cost_price, barcode")
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

  let suppliersQuery = supabase
    .from("suppliers")
    .select("key:id, label:name")
    .order("name");
  if (context.isSuperAdmin && activeOrgId) {
    suppliersQuery = suppliersQuery.eq("organization_id", activeOrgId);
  } else {
    suppliersQuery = applyOrganizationFilter(suppliersQuery, context);
  }
  const { data: suppliers } = await suppliersQuery;

  return {
    data: {
      purchaseOrders: finalPurchaseOrders || [],
      products: products || [],
      warehouses: warehouses || [],
      suppliers: suppliers || [],
    },
  };
}

export async function createPurchaseOrderAction(
  values: PurchaseOrderFormInput,
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = purchaseOrderSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Calculate total amount
  const totalAmount = validatedFields.data.items_data.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  // Create purchase order
  const { data: purchaseOrder, error: poError } = await supabase
    .from("purchase_orders")
    .insert([
      {
        supplier_id: validatedFields.data.supplier_id,
        notes: validatedFields.data.notes,
        total_amount: totalAmount,
        created_by: context.userId,
        ...getBranchDefaults(context),
      },
    ])
    .select()
    .single();

  if (poError || !purchaseOrder) {
    console.error(poError);
    return { error: "Database error: Could not create purchase order." };
  }

  // Create purchase order items
  const items = validatedFields.data.items_data.map((item) => ({
    purchase_order_id: purchaseOrder.id,
    product_id: item.product_id,
    warehouse_id: item.warehouse_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }));

  const { error: itemsError } = await supabase
    .from("purchase_order_items")
    .insert(items);

  if (itemsError) {
    console.error(itemsError);
    // Rollback: delete the purchase order
    await supabase.from("purchase_orders").delete().eq("id", purchaseOrder.id);
    return { error: "Database error: Could not create purchase order items." };
  }

  revalidatePath("/purchases");
  revalidatePath("/warehouses");
  revalidatePath("/inventory");
  return { success: true };
}

export async function updatePurchaseOrderAction(
  id: string,
  values: PurchaseOrderFormInput,
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = purchaseOrderSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Calculate total amount
  const totalAmount = validatedFields.data.items_data.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );

  // Update purchase order
  const { error: poError } = await supabase
    .from("purchase_orders")
    .update({
      supplier_id: validatedFields.data.supplier_id,
      notes: validatedFields.data.notes,
      total_amount: totalAmount,
    })
    .eq("id", id);

  if (poError) {
    console.error(poError);
    return { error: "Database error: Could not update purchase order." };
  }

  // Delete existing items
  const { error: deleteError } = await supabase
    .from("purchase_order_items")
    .delete()
    .eq("purchase_order_id", id);

  if (deleteError) {
    console.error(deleteError);
    return { error: "Database error: Could not clear existing items." };
  }

  // Create new purchase order items
  const items = validatedFields.data.items_data.map((item) => ({
    purchase_order_id: id,
    product_id: item.product_id,
    warehouse_id: item.warehouse_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }));

  const { error: itemsError } = await supabase
    .from("purchase_order_items")
    .insert(items);

  if (itemsError) {
    console.error(itemsError);
    return { error: "Database error: Could not update purchase order items." };
  }

  revalidatePath("/purchases");
  revalidatePath("/warehouses");
  revalidatePath("/inventory");
  return { success: true };
}

export async function deletePurchaseOrderAction(id: string) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  // Note: Items will be deleted automatically due to CASCADE
  // But stock won't be reversed - this is intentional for audit purposes
  let query = supabase.from("purchase_orders").delete().eq("id", id);

  query = applyBranchFilter(query, context);

  const { error } = await query;

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete purchase order." };
  }

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/warehouses");
  return { success: true };
}
