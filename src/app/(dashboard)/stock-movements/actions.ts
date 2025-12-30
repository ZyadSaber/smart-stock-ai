"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  stockMovementSchema,
  type StockMovementFormInput,
} from "@/lib/validations/stock-movement";

export async function createStockMovementAction(
  values: StockMovementFormInput
) {
  const supabase = await createClient();

  const validatedFields = stockMovementSchema.safeParse(values);

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

  // Check if source warehouse has enough stock
  if (
    validatedFields.data.from_warehouse_id &&
    validatedFields.data.from_warehouse_id !== "none"
  ) {
    const { data: stock } = await supabase
      .from("product_stocks")
      .select("quantity")
      .eq("product_id", validatedFields.data.product_id)
      .eq("warehouse_id", validatedFields.data.from_warehouse_id)
      .single();

    if (!stock) {
      return {
        error:
          "No stock record found for this product in the source warehouse.",
      };
    }

    if (stock.quantity < validatedFields.data.quantity) {
      return {
        error: `Insufficient stock. Available: ${stock.quantity}, Requested: ${validatedFields.data.quantity}`,
      };
    }
  }

  const { error } = await supabase
    .from("stock_movements")
    .insert([
      {
        ...validatedFields.data,
        created_by: user.id,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create stock movement." };
  }

  revalidatePath("/warehouses");
  revalidatePath("/stock-movements");
  return { success: true };
}

export async function updateStockMovementAction(
  id: string,
  values: StockMovementFormInput
) {
  const supabase = await createClient();
  const validatedFields = stockMovementSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Get current movement to compare
  const { data: oldMovement } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("id", id)
    .single();

  if (!oldMovement) return { error: "Movement not found." };

  // If source warehouse changed or quantity increased, we must check overdraft
  // We check if (Current Stock + Old Released Quantity) >= New Requested Quantity
  if (
    validatedFields.data.from_warehouse_id &&
    validatedFields.data.from_warehouse_id !== "none"
  ) {
    const { data: stock } = await supabase
      .from("product_stocks")
      .select("quantity")
      .eq("product_id", validatedFields.data.product_id)
      .eq("warehouse_id", validatedFields.data.from_warehouse_id)
      .single();

    const currentQuantity = stock?.quantity || 0;
    const oldReleased =
      oldMovement.from_warehouse_id === validatedFields.data.from_warehouse_id
        ? oldMovement.quantity
        : 0;

    if (currentQuantity + oldReleased < validatedFields.data.quantity) {
      return {
        error: "Insufficient stock in source warehouse for this update.",
      };
    }
  }

  const { error } = await supabase
    .from("stock_movements")
    .update({
      ...validatedFields.data,
      from_warehouse_id:
        validatedFields.data.from_warehouse_id === "none"
          ? null
          : validatedFields.data.from_warehouse_id,
      to_warehouse_id:
        validatedFields.data.to_warehouse_id === "none"
          ? null
          : validatedFields.data.to_warehouse_id,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update movement." };
  }

  revalidatePath("/warehouses");
  revalidatePath("/stock-movements");
  return { success: true };
}

export async function deleteStockMovementAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("stock_movements")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete movement." };
  }

  revalidatePath("/warehouses");
  revalidatePath("/stock-movements");
  return { success: true };
}

export async function getStockMovements() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_movements")
    .select(
      `
      id,
      quantity,
      notes,
      created_at,
      products (name, barcode),
      from_warehouse:warehouses!stock_movements_from_warehouse_id_fkey (name),
      to_warehouse:warehouses!stock_movements_to_warehouse_id_fkey (name),
      created_by_user:profiles!stock_movements_created_by_profiles_fkey (full_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getStockFlowData() {
  const supabase = await createClient();

  // 1. Get Inbound Flow (Purchases)
  const { data: inboundData, error: inError } = await supabase.from(
    "purchase_order_items"
  ).select(`
      quantity,
      purchase_orders!inner ( created_at )
    `);

  if (inError) {
    console.error(inError);
    return [];
  }

  // 2. Get Outbound Flow (Sales)
  const { data: outboundData, error: outError } = await supabase.from(
    "sale_items"
  ).select(`
      quantity,
      sales!inner ( created_at )
    `);

  if (outError) {
    console.error(outError);
    return [];
  }

  // 3. Aggregate by Date
  const flowMap: Record<
    string,
    { date: string; inbound: number; outbound: number }
  > = {};

  interface InboundRaw {
    quantity: number;
    purchase_orders: { created_at: string } | { created_at: string }[];
  }

  interface OutboundRaw {
    quantity: number;
    sales: { created_at: string } | { created_at: string }[];
  }

  // Process Inbound
  (inboundData as unknown as InboundRaw[]).forEach((item) => {
    const createdObj = Array.isArray(item.purchase_orders)
      ? item.purchase_orders[0]
      : item.purchase_orders;
    if (createdObj) {
      const date = new Date(createdObj.created_at).toLocaleDateString("en-CA");
      if (!flowMap[date]) flowMap[date] = { date, inbound: 0, outbound: 0 };
      flowMap[date].inbound += item.quantity;
    }
  });

  // Process Outbound
  (outboundData as unknown as OutboundRaw[]).forEach((item) => {
    const createdObj = Array.isArray(item.sales) ? item.sales[0] : item.sales;
    if (createdObj) {
      const date = new Date(createdObj.created_at).toLocaleDateString("en-CA");
      if (!flowMap[date]) flowMap[date] = { date, inbound: 0, outbound: 0 };
      flowMap[date].outbound += item.quantity;
    }
  });

  // Sort by date
  return Object.values(flowMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
