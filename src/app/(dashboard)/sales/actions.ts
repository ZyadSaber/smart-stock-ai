"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { saleSchema, type SaleFormInput } from "@/lib/validations/sale";
import { Sale, SaleItem } from "@/types/sales";
import {
  getTenantContext,
  getBranchDefaults,
  applyBranchFilter,
  applyOrganizationFilter,
} from "@/lib/tenant";

export async function createSaleAction(values: SaleFormInput) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = saleSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Get current user - Removed, using context.userId

  // Check stock availability for all items before proceeding
  // We MUST check stock for the CURRENT branch
  for (const item of validatedFields.data.items) {
    let stockQuery = supabase
      .from("product_stocks")
      .select("quantity")
      .eq("product_id", item.product_id)
      .eq("warehouse_id", item.warehouse_id);

    // Ensure we are checking stock in our own branch
    stockQuery = applyBranchFilter(stockQuery, context);

    const { data: stock, error: stockError } = await stockQuery.maybeSingle();

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

  // Products are Organization level
  let productsQuery = supabase
    .from("products")
    .select("id, cost_price")
    .in("id", productIds);
  productsQuery = applyOrganizationFilter(productsQuery, context);
  const { data: products } = await productsQuery;

  const productMap = new Map(products?.map((p) => [p.id, p.cost_price]));

  for (const item of validatedFields.data.items) {
    const subtotal = item.quantity * item.unit_price;
    totalAmount += subtotal;

    const costPrice = productMap.get(item.product_id) || 0;
    totalProfit += (item.unit_price - costPrice) * item.quantity;
  }

  // Create sale record
  // Inject branch defaults
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert([
      {
        customer_name: validatedFields.data.customer_name,
        notes: validatedFields.data.notes,
        total_amount: totalAmount,
        profit_amount: totalProfit,
        user_id: context.userId,
        ...getBranchDefaults(context),
      },
    ])
    .select()
    .single();

  if (saleError || !sale) {
    console.error(saleError);
    return {
      error: "Database error: Could not create sale record.",
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

export async function getSales(
  searchParams: { organization_id?: string; branch_id?: string } = {}
): Promise<Sale[]> {
  const context = await getTenantContext();
  if (!context) return [];

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

  let query = supabase.from("sales").select(
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
  );

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      query = query.eq("branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      query = query.in("branch_id", branchIds);
    }
  } else {
    query = applyBranchFilter(query, context);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

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
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  let query = supabase.from("sales").delete().eq("id", id);
  query = applyBranchFilter(query, context);

  const { error } = await query;

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete sale." };
  }

  revalidatePath("/sales");
  revalidatePath("/inventory");
  return { success: true };
}

export async function getSaleItems(saleId: string): Promise<SaleItem[]> {
  const context = await getTenantContext();
  if (!context) return [];

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

  // Filter in memory if needed or trust that sale_id already restricts to the right tenant
  // Since sale_id is unique and the sale itself is restricted, items are implicitly restricted

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

export async function getTopSellingProducts(
  searchParams: { organization_id?: string; branch_id?: string } = {}
) {
  const context = await getTenantContext();
  if (!context) return [];

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

  // Joint filtering for top selling products in this branch
  let query = supabase.from("sale_items").select(
    `
      quantity,
      products ( name ),
      sales!inner ( branch_id )
    `
  );

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      query = query.eq("sales.branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      query = query.in("sales.branch_id", branchIds);
    }
  } else if (context.branchId) {
    query = query.eq("sales.branch_id", context.branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  // Aggregate quantity by product name
  const productStats: Record<string, number> = {};

  const items = data as unknown as {
    quantity: number;
    products: { name: string } | { name: string }[] | null;
  }[];

  items.forEach((item) => {
    // Handle potential array or null returns from join
    const productName = Array.isArray(item.products)
      ? item.products[0]?.name
      : item.products?.name;

    if (productName) {
      productStats[productName] =
        (productStats[productName] || 0) + item.quantity;
    }
  });

  // Convert to array and sort by quantity descending
  return Object.entries(productStats)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // Return top 5
}

export async function getSaleForInvoice(saleId: string) {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  let saleQuery = supabase
    .from("sales")
    .select(
      `
      *,
      profiles:profiles!sales_user_id_fkey (full_name)
    `
    )
    .eq("id", saleId);

  saleQuery = applyBranchFilter(saleQuery, context);

  const { data: sale, error: saleError } = await saleQuery.single();

  if (saleError || !sale) {
    console.error(saleError);
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select(
      `
      *,
      products (name, barcode)
    `
    )
    .eq("sale_id", saleId);

  if (itemsError) {
    console.error(itemsError);
    return null;
  }

  return {
    ...sale,
    seller_name:
      (sale.profiles as unknown as { full_name: string | null })?.full_name ||
      "System",
    items: (items as unknown as Record<string, unknown>[]).map((item) => ({
      ...item,
      product_name:
        (item.products as unknown as { name: string })?.name || "Product",
      barcode: (item.products as unknown as { barcode: string | null })
        ?.barcode,
    })),
  };
}
