"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  purchaseOrderSchema,
  type PurchaseOrderFormInput,
} from "@/lib/validations/purchase-order";

export async function createPurchaseOrderAction(
  values: PurchaseOrderFormInput
) {
  const supabase = await createClient();

  const validatedFields = purchaseOrderSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }

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
        created_by: user.id,
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
  return { success: true };
}

export async function getPurchaseOrders() {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getPurchaseOrderDetails(id: string) {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
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
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
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

  if (itemsError) {
    return null;
  }

  return { ...order, items };
}

export async function deletePurchaseOrderAction(id: string) {
  const supabase = await createClient();

  // Note: Items will be deleted automatically due to CASCADE
  // But stock won't be reversed - this is intentional for audit purposes
  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete purchase order." };
  }

  revalidatePath("/purchases");
  return { success: true };
}
