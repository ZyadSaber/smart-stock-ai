"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { saleSchema, type SaleFormInput } from "@/lib/validations/sale";
import { Sale, SaleItem } from "@/types/sales";

export async function createSaleAction(values: SaleFormInput) {
  const supabase = await createClient();

  const validatedFields = saleSchema.safeParse(values);

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

  // Check stock availability for all items before proceeding
  for (const item of validatedFields.data.items) {
    const { data: stock, error: stockError } = await supabase
      .from("product_stocks")
      .select("quantity")
      .eq("product_id", item.product_id)
      .eq("warehouse_id", item.warehouse_id)
      .maybeSingle();

    if (stockError) {
      return { error: `Error checking stock for item ${item.product_id}` };
    }

    if (!stock || stock.quantity < item.quantity) {
      const { data: product } = await supabase
        .from("products")
        .select("name")
        .eq("id", item.product_id)
        .single();

      return {
        error: `Insufficient stock for ${
          product?.name || "product"
        }. Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`,
      };
    }
  }

  // Calculate total amount and profit
  let totalAmount = 0;
  let totalProfit = 0;

  const productIds = validatedFields.data.items.map((i) => i.product_id);
  const { data: products } = await supabase
    .from("products")
    .select("id, cost_price")
    .in("id", productIds);

  const productMap = new Map(products?.map((p) => [p.id, p.cost_price]));

  for (const item of validatedFields.data.items) {
    const subtotal = item.quantity * item.unit_price;
    totalAmount += subtotal;

    const costPrice = productMap.get(item.product_id) || 0;
    totalProfit += (item.unit_price - costPrice) * item.quantity;
  }

  // Create sale record
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert([
      {
        customer_name: validatedFields.data.customer_name,
        notes: validatedFields.data.notes,
        total_amount: totalAmount,
        profit_amount: totalProfit,
        user_id: user.id,
      },
    ])
    .select()
    .single();

  if (saleError || !sale) {
    console.error(saleError);
    return {
      error:
        "Database error: Could not create sale record. Please ensure customer_name and notes columns exist.",
    };
  }

  // Create sale items
  const items = validatedFields.data.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    warehouse_id: item.warehouse_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(items);

  if (itemsError) {
    console.error(itemsError);
    await supabase.from("sales").delete().eq("id", sale.id);
    return { error: "Database error: Could not create sale items." };
  }

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/warehouses");
  return { success: true };
}

export async function getSales(): Promise<Sale[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sales")
    .select(
      `
      id,
      customer_name,
      notes,
      total_amount,
      profit_amount,
      created_at,
      user_id,
      profiles:profiles!sales_user_id_fkey (full_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  const rawSales = data as unknown as (Sale & {
    profiles: { full_name: string | null } | { full_name: string | null }[];
  })[];

  return rawSales.map((sale) => ({
    ...sale,
    profiles: Array.isArray(sale.profiles) ? sale.profiles[0] : sale.profiles,
  })) as Sale[];
}

export async function deleteSaleAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("sales").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete sale." };
  }

  revalidatePath("/sales");
  revalidatePath("/inventory");
  return { success: true };
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sale_items")
    .select(
      `
      id,
      sale_id,
      product_id,
      warehouse_id,
      quantity,
      unit_price,
      products (name, barcode),
      warehouses (name)
    `
    )
    .eq("sale_id", saleId);

  if (error) {
    console.error(error);
    return [];
  }

  const rawItems = data as unknown as (SaleItem & {
    products:
      | { name: string; barcode: string }
      | { name: string; barcode: string }[];
    warehouses: { name: string } | { name: string }[];
  })[];

  return rawItems.map((item) => ({
    ...item,
    products: Array.isArray(item.products) ? item.products[0] : item.products,
    warehouses: Array.isArray(item.warehouses)
      ? item.warehouses[0]
      : item.warehouses,
  })) as SaleItem[];
}
