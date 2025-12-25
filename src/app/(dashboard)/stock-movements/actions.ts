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
  if (validatedFields.data.from_warehouse_id) {
    const { data: stock } = await supabase
      .from("product_stocks")
      .select("quantity")
      .eq("product_id", validatedFields.data.product_id)
      .eq("warehouse_id", validatedFields.data.from_warehouse_id)
      .single();

    if (!stock || stock.quantity < validatedFields.data.quantity) {
      return { error: "Insufficient stock in source warehouse." };
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
