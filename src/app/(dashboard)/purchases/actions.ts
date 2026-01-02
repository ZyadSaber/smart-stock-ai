"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  purchaseOrderSchema,
  type PurchaseOrderFormInput,
} from "@/lib/validations/purchase-order";
import { PurchaseOrder, PurchaseOrderItem } from "@/types/purchases";
import {
  getTenantContext,
  getBranchDefaults,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";

export async function createPurchaseOrderAction(
  values: PurchaseOrderFormInput
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = purchaseOrderSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Get current user - no longer needed, using context.userId
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) {
  //   return { error: "User not authenticated." };
  // }

  // Calculate total amount
  const totalAmount = validatedFields.data.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  // Create purchase order
  const { data: purchaseOrder, error: poError } = await supabase
    .from("purchase_orders")
    .insert([
      {
        supplier_name: validatedFields.data.supplier_name,
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
  const items = validatedFields.data.items.map((item) => ({
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

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const context = await getTenantContext();
  if (!context) return [];

  const supabase = await createClient();

  let query = supabase.from("purchase_orders").select(
    `
      id,
      supplier_name,
      total_amount,
      notes,
      created_at,
      created_by_user:profiles!purchase_orders_created_by_profiles_fkey (full_name)
    `
  );

  query = applyBranchFilter(query, context);
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return (data as any[]).map((order) => ({
    ...order,
    created_by_user: Array.isArray(order.created_by_user)
      ? order.created_by_user[0]
      : order.created_by_user,
  })) as PurchaseOrder[];
}

export async function getPurchaseOrderDetails(
  id: string
): Promise<(PurchaseOrder & { items: PurchaseOrderItem[] }) | null> {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  let orderQuery = supabase
    .from("purchase_orders")
    .select(
      `
      id,
      supplier_name,
      total_amount,
      notes,
      created_at,
      created_by_user:profiles!purchase_orders_created_by_profiles_fkey (full_name)
    `
    )
    .eq("id", id);

  orderQuery = applyBranchFilter(orderQuery, context);

  const { data: order, error: orderError } = await orderQuery.single();

  if (orderError || !order) {
    return null;
  }

  let itemsQuery = supabase
    .from("purchase_order_items")
    .select(
      `
      id,
      quantity,
      unit_price,
      total_price,
      products (name, barcode),
      warehouses (name)
    `
    )
    .eq("purchase_order_id", id);

  // Apply organization filter to products within items
  itemsQuery = applyOrganizationFilter(itemsQuery, context, "products");

  const { data: items, error: itemsError } = await itemsQuery;

  if (itemsError || !items) {
    return null;
  }

  const typedOrder = {
    ...order,
    created_by_user: Array.isArray(order.created_by_user)
      ? order.created_by_user[0]
      : order.created_by_user,
  } as PurchaseOrder;

  const typedItems = (items as any[]).map((item) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] : item.products,
    warehouses: Array.isArray(item.warehouses)
      ? item.warehouses[0]
      : item.warehouses,
  })) as PurchaseOrderItem[];

  return { ...typedOrder, items: typedItems };
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

export async function deletePurchaseOrderItemAction(itemId: string) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  // We should ideally ensure this item belongs to a PO in our branch
  // For simplicity, we can do an inner join check or just rely on the PO check
  // But let's be safe
  const { data: item } = await supabase
    .from("purchase_order_items")
    .select("purchase_order_id")
    .eq("id", itemId)
    .single();

  if (item) {
    let poQuery = supabase
      .from("purchase_orders")
      .select("id")
      .eq("id", item.purchase_order_id);
    poQuery = applyBranchFilter(poQuery, context);
    const { data: po } = await poQuery.maybeSingle();
    if (!po) return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("purchase_order_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete purchase order item." };
  }

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/warehouses");
  return { success: true };
}

export async function getPurchaseOrderItems(
  purchaseId: string
): Promise<PurchaseOrderItem[]> {
  const context = await getTenantContext();
  if (!context) return [];

  const supabase = await createClient();

  // Ensure PO belongs to branch
  let poQuery = supabase
    .from("purchase_orders")
    .select("id")
    .eq("id", purchaseId);
  poQuery = applyBranchFilter(poQuery, context);
  const { data: po } = await poQuery.maybeSingle();
  if (!po) return [];

  let itemsQuery = supabase
    .from("purchase_order_items")
    .select(
      `
      id,
      quantity,
      unit_price,
      total_price,
      products (name, barcode),
      warehouses (name)
    `
    )
    .eq("purchase_order_id", purchaseId);

  // Apply organization filter to products within items
  itemsQuery = applyOrganizationFilter(itemsQuery, context, "products");

  const { data, error } = await itemsQuery;

  if (error) {
    console.error(error);
    return [];
  }

  return (data as any[]).map((item) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] : item.products,
    warehouses: Array.isArray(item.warehouses)
      ? item.warehouses[0]
      : item.warehouses,
  })) as PurchaseOrderItem[];
}

export async function updatePurchaseOrderItemAction(
  itemId: string,
  quantity: number,
  unitPrice: number
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  // Ensure item belongs to branch
  const { data: item } = await supabase
    .from("purchase_order_items")
    .select("purchase_order_id")
    .eq("id", itemId)
    .single();

  if (item) {
    let poQuery = supabase
      .from("purchase_orders")
      .select("id")
      .eq("id", item.purchase_order_id);
    poQuery = applyBranchFilter(poQuery, context);
    const { data: po } = await poQuery.maybeSingle();
    if (!po) return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("purchase_order_items")
    .update({
      quantity,
      unit_price: unitPrice,
      total_price: quantity * unitPrice,
    })
    .eq("id", itemId);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update item." };
  }

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/warehouses");
  return { success: true };
}
