"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  warehouseSchema,
  type WarehouseFormInput,
} from "@/lib/validations/warehouse";

export async function createWarehouseAction(values: WarehouseFormInput) {
  const supabase = await createClient();

  const validatedFields = warehouseSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("warehouses")
    .insert([validatedFields.data])
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create warehouse." };
  }

  revalidatePath("/warehouses");
  return { success: true };
}

export async function updateWarehouseAction(
  id: string,
  values: WarehouseFormInput
) {
  const supabase = await createClient();

  const validatedFields = warehouseSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("warehouses")
    .update(validatedFields.data)
    .eq("id", id)
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update warehouse." };
  }

  revalidatePath("/warehouses");
  return { success: true };
}

export async function deleteWarehouseAction(id: string) {
  const supabase = await createClient();

  // First check if warehouse has stock
  const { data: stocks, error: checkError } = await supabase
    .from("product_stocks")
    .select("id")
    .eq("warehouse_id", id)
    .limit(1);

  if (checkError) {
    console.error(checkError);
    return { error: "Database error: Could not check warehouse usage." };
  }

  if (stocks && stocks.length > 0) {
    return {
      error:
        "Cannot delete warehouse that has stock. Please transfer or remove the stock first.",
    };
  }

  const { error } = await supabase.from("warehouses").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete warehouse." };
  }

  revalidatePath("/warehouses");
  return { success: true };
}

// Update stock quantity for a product in a warehouse
export async function updateStockAction(
  productId: string,
  warehouseId: string,
  quantity: number
) {
  const supabase = await createClient();

  if (quantity < 0) {
    return { error: "Quantity cannot be negative." };
  }

  // Check if stock record exists
  const { data: existingStock } = await supabase
    .from("product_stocks")
    .select("id")
    .eq("product_id", productId)
    .eq("warehouse_id", warehouseId)
    .single();

  if (existingStock) {
    // Update existing stock
    const { error } = await supabase
      .from("product_stocks")
      .update({ quantity })
      .eq("product_id", productId)
      .eq("warehouse_id", warehouseId);

    if (error) {
      console.error(error);
      return { error: "Database error: Could not update stock." };
    }
  } else {
    // Create new stock record
    const { error } = await supabase
      .from("product_stocks")
      .insert([{ product_id: productId, warehouse_id: warehouseId, quantity }]);

    if (error) {
      console.error(error);
      return { error: "Database error: Could not create stock record." };
    }
  }

  revalidatePath("/warehouses");
  return { success: true };
}
