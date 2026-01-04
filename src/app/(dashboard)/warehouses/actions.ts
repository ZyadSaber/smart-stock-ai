"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  warehouseSchema,
  type WarehouseFormInput,
} from "@/lib/validations/warehouse";
import {
  getTenantContext,
  getBranchDefaults,
  applyBranchFilter,
} from "@/lib/tenant";

export async function createWarehouseAction(values: WarehouseFormInput) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = warehouseSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("warehouses")
    .insert([
      {
        ...validatedFields.data,
        ...getBranchDefaults(context),
      },
    ])
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
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = warehouseSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  let query = supabase
    .from("warehouses")
    .update(validatedFields.data)
    .eq("id", id);
  query = applyBranchFilter(query, context);

  const { error } = await query.select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update warehouse." };
  }

  revalidatePath("/warehouses");
  return { success: true };
}

export async function deleteWarehouseAction(id: string) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  // First check if warehouse has stock
  let checkQuery = supabase
    .from("product_stocks")
    .select("id")
    .eq("warehouse_id", id)
    .limit(1);
  checkQuery = applyBranchFilter(checkQuery, context);

  const { data: stocks, error: checkError } = await checkQuery;

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

  let deleteQuery = supabase.from("warehouses").delete().eq("id", id);
  deleteQuery = applyBranchFilter(deleteQuery, context);

  const { error } = await deleteQuery;

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
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  if (quantity < 0) {
    return { error: "Quantity cannot be negative." };
  }

  // Check if stock record exists
  let checkQuery = supabase
    .from("product_stocks")
    .select("id")
    .eq("product_id", productId)
    .eq("warehouse_id", warehouseId);

  checkQuery = applyBranchFilter(checkQuery, context);

  const { data: existingStock } = await checkQuery.maybeSingle();

  if (existingStock) {
    // Update existing stock
    let updateQuery = supabase
      .from("product_stocks")
      .update({ quantity })
      .eq("product_id", productId)
      .eq("warehouse_id", warehouseId);

    updateQuery = applyBranchFilter(updateQuery, context);

    const { error } = await updateQuery;

    if (error) {
      console.error(error);
      return { error: "Database error: Could not update stock." };
    }
  } else {
    // Create new stock record
    const { error } = await supabase.from("product_stocks").insert([
      {
        product_id: productId,
        warehouse_id: warehouseId,
        quantity,
        ...getBranchDefaults(context),
      },
    ]);

    if (error) {
      console.error(error);
      return { error: "Database error: Could not create stock record." };
    }
  }

  revalidatePath("/warehouses");
  revalidatePath("/inventory");
  return { success: true };
}

export async function bulkUpdateStockAction(
  updates: {
    product_id?: string;
    warehouse_id: string;
    quantity: number;
    barcode?: string;
  }[]
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();
  const branchDefaults = getBranchDefaults(context);

  const results = {
    success: 0,
    errors: [] as string[],
  };

  for (const update of updates) {
    try {
      let productId = update.product_id;

      // If barcode is provided, find the product ID
      if (!productId) {
        const { data: product } = await supabase
          .from("products")
          .select("id")
          .eq("barcode", update.barcode)
          .maybeSingle();

        if (product) {
          productId = product.id;
        } else {
          results.errors.push(
            `Product with barcode "${update.barcode}" not found.`
          );
          continue;
        }
      }

      if (!productId) {
        results.errors.push(
          `No product identified for an update in warehouse ${update.warehouse_id}.`
        );
        continue;
      }

      // Logic from updateStockAction
      let checkQuery = supabase
        .from("product_stocks")
        .select("id")
        .eq("product_id", productId)
        .eq("warehouse_id", update.warehouse_id);

      checkQuery = applyBranchFilter(checkQuery, context);
      const { data: existingStock } = await checkQuery.maybeSingle();

      if (existingStock) {
        let updateQuery = supabase
          .from("product_stocks")
          .update({ quantity: update.quantity })
          .eq("id", existingStock.id);

        updateQuery = applyBranchFilter(updateQuery, context);

        const { error } = await updateQuery;
        if (error) throw error;
      } else {
        const { error } = await supabase.from("product_stocks").insert([
          {
            product_id: productId,
            warehouse_id: update.warehouse_id,
            quantity: update.quantity,
            ...branchDefaults,
          },
        ]);
        if (error) throw error;
      }
      results.success++;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      results.errors.push(
        `Error updating stock for ${
          update.product_id || update.barcode
        }: ${errorMessage}`
      );
    }
  }

  revalidatePath("/warehouses");
  revalidatePath("/inventory");

  return {
    success: results.success > 0,
    count: results.success,
    errors: results.errors,
  };
}

export async function getAllWarehousesValuation(
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

  // 1. Get all warehouses based on context or super admin choice
  let query = supabase.from("warehouses").select("id, name");

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

  const { data: warehouses, error: wError } = await query;

  if (wError || !warehouses) {
    console.error(wError);
    return [];
  }

  // 2. Fetch valuation for each
  const valuations = await Promise.all(
    warehouses.map(async (w) => {
      const { data, error } = await supabase.rpc("get_warehouse_valuation", {
        w_id: w.id,
      });

      if (error || !data || data.length === 0) {
        return {
          name: w.name,
          total_cost: 0,
          total_revenue: 0,
          projected_profit: 0,
        };
      }

      return {
        name: w.name,
        total_cost: Number(data[0].total_cost) || 0,
        total_revenue: Number(data[0].total_revenue) || 0,
        projected_profit: Number(data[0].projected_profit) || 0,
      };
    })
  );

  return valuations;
}
