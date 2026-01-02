"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  stockMovementSchema,
  type StockMovementFormInput,
} from "@/lib/validations/stock-movement";
import {
  getTenantContext,
  getBranchDefaults,
  applyBranchFilter,
} from "@/lib/tenant";

export async function createStockMovementAction(
  values: StockMovementFormInput
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = stockMovementSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Get current user - Replaced by context.userId
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) {
  //   return { error: "User not authenticated." };
  // }

  // Check if source warehouse has enough stock
  if (
    validatedFields.data.from_warehouse_id &&
    validatedFields.data.from_warehouse_id !== "none"
  ) {
    let stockQuery = supabase
      .from("product_stocks")
      .select("quantity")
      .eq("product_id", validatedFields.data.product_id)
      .eq("warehouse_id", validatedFields.data.from_warehouse_id);

    stockQuery = applyBranchFilter(stockQuery, context);

    const { data: stock } = await stockQuery.maybeSingle();

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
        created_by: context.userId,
        ...getBranchDefaults(context),
      },
    ])
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create stock movement." };
  }

  revalidatePath("/warehouses");
  revalidatePath("/inventory");
  revalidatePath("/stock-movements");
  return { success: true };
}

export async function updateStockMovementAction(
  id: string,
  values: StockMovementFormInput
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();
  const validatedFields = stockMovementSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Get current movement to compare
  let oldMovementQuery = supabase
    .from("stock_movements")
    .select("*")
    .eq("id", id);

  oldMovementQuery = applyBranchFilter(oldMovementQuery, context);

  const { data: oldMovement } = await oldMovementQuery.single();

  if (!oldMovement) return { error: "Movement not found." };

  // If source warehouse changed or quantity increased, we must check overdraft
  // We check if (Current Stock + Old Released Quantity) >= New Requested Quantity
  if (
    validatedFields.data.from_warehouse_id &&
    validatedFields.data.from_warehouse_id !== "none"
  ) {
    let stockQuery = supabase
      .from("product_stocks")
      .select("quantity")
      .eq("product_id", validatedFields.data.product_id)
      .eq("warehouse_id", validatedFields.data.from_warehouse_id);

    stockQuery = applyBranchFilter(stockQuery, context);

    const { data: stock } = await stockQuery.maybeSingle();

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

  let finalUpdateQuery = supabase
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

  finalUpdateQuery = applyBranchFilter(finalUpdateQuery, context);

  const { error } = await finalUpdateQuery;

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update movement." };
  }

  revalidatePath("/warehouses");
  revalidatePath("/inventory");
  revalidatePath("/stock-movements");
  return { success: true };
}

export async function deleteStockMovementAction(id: string) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  let query = supabase.from("stock_movements").delete().eq("id", id);

  query = applyBranchFilter(query, context);

  const { error } = await query;

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete movement." };
  }

  revalidatePath("/warehouses");
  revalidatePath("/inventory");
  revalidatePath("/stock-movements");
  return { success: true };
}

export async function getStockMovements() {
  const context = await getTenantContext();
  if (!context) return [];

  const supabase = await createClient();

  let query = supabase.from("stock_movements").select(
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
  );

  query = applyBranchFilter(query, context);
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getStockFlowData(
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

  // 1. Get Inbound Flow (Purchases)
  let inboundQuery = supabase.from("purchase_order_items").select(`
      quantity,
      purchase_orders!inner ( created_at, branch_id )
    `);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      inboundQuery = inboundQuery.eq(
        "purchase_orders.branch_id",
        activeBranchId
      );
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      inboundQuery = inboundQuery.in("purchase_orders.branch_id", branchIds);
    }
  } else if (context.branchId) {
    inboundQuery = inboundQuery.eq(
      "purchase_orders.branch_id",
      context.branchId
    );
  }

  const { data: inboundData, error: inError } = await inboundQuery;

  if (inError) {
    console.error(inError);
    return [];
  }

  // 2. Get Outbound Flow (Sales)
  let outboundQuery = supabase.from("sale_items").select(`
      quantity,
      sales!inner ( created_at, branch_id )
    `);

  if (context.isSuperAdmin) {
    if (activeBranchId) {
      outboundQuery = outboundQuery.eq("sales.branch_id", activeBranchId);
    } else if (activeOrgId) {
      const { data: orgBranches } = await supabase
        .from("branches")
        .select("id")
        .eq("organization_id", activeOrgId);
      const branchIds = orgBranches?.map((b) => b.id) || [];
      outboundQuery = outboundQuery.in("sales.branch_id", branchIds);
    }
  } else if (context.branchId) {
    outboundQuery = outboundQuery.eq("sales.branch_id", context.branchId);
  }

  const { data: outboundData, error: outError } = await outboundQuery;

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
    purchase_orders:
      | { created_at: string; branch_id: string | null }
      | { created_at: string; branch_id: string | null }[];
  }

  interface OutboundRaw {
    quantity: number;
    sales:
      | { created_at: string; branch_id: string | null }
      | { created_at: string; branch_id: string | null }[];
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
