"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/validations/product";
import type { z } from "zod";
import {
  getTenantContext,
  getOrganizationDefaults,
  applyOrganizationFilter,
} from "@/lib/tenant";

export type ProductFormInput = z.input<typeof productSchema>;

export async function createProductAction(values: ProductFormInput) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = productSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert([
      {
        name: validatedFields.data.name,
        barcode: validatedFields.data.barcode,
        cost_price: validatedFields.data.cost_price,
        selling_price: validatedFields.data.selling_price,
        category_id: validatedFields.data.category_id,
        ...getOrganizationDefaults(context),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create product." };
  }

  // Handle initial quantity if provided
  if (
    validatedFields.data.initial_quantity &&
    validatedFields.data.warehouse_id &&
    product
  ) {
    const { getBranchDefaults } = await import("@/lib/tenant");
    const { error: stockError } = await supabase.from("product_stocks").insert([
      {
        product_id: product.id,
        warehouse_id: validatedFields.data.warehouse_id,
        quantity: validatedFields.data.initial_quantity,
        ...getBranchDefaults(context),
      },
    ]);

    if (stockError) {
      console.error("Failed to create initial stock:", stockError);
      // We don't return error here because the product was created successfully
    }
  }

  revalidatePath("/inventory");
  revalidatePath("/warehouses");
  return { success: true };
}

export async function updateProductAction(
  id: string,
  values: ProductFormInput
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = productSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // Ensure user can only update products in their organization
  let query = supabase
    .from("products")
    .update(validatedFields.data)
    .eq("id", id);
  query = applyOrganizationFilter(query, context);

  const { error } = await query.select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update product." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteProductAction(id: string) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  // Ensure user can only delete products in their organization
  let query = supabase.from("products").delete().eq("id", id);
  query = applyOrganizationFilter(query, context);

  const { error } = await query;

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete product." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function bulkCreateProductsAction(products: ProductFormInput[]) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();
  const orgDefaults = getOrganizationDefaults(context);

  const validatedProducts = [];
  const errors = [];

  for (const product of products) {
    const validated = productSchema.safeParse(product);
    if (validated.success) {
      validatedProducts.push({
        ...validated.data,
        ...orgDefaults,
      });
    } else {
      errors.push(
        `Product "${product.name || "Unknown"}": ${
          validated.error.issues[0]?.message || "Invalid data"
        }`
      );
    }
  }

  if (validatedProducts.length === 0) {
    return { error: "No valid products found to import.", details: errors };
  }

  const { data: createdProducts, error } = await supabase
    .from("products")
    .insert(validatedProducts)
    .select();

  if (error) {
    console.error(error);
    return {
      error: "Database error: Could not import products.",
      details: [error.message],
    };
  }

  // Handle initial stock for bulk imports
  if (createdProducts && createdProducts.length > 0) {
    const stockToInsert = [];
    const { getBranchDefaults } = await import("@/lib/tenant");
    const branchDefaults = getBranchDefaults(context);

    // We need to match created products back to their original input to get initial_quantity
    // Using barcode as the matcher
    for (const created of createdProducts) {
      const original = products.find((p) => p.barcode === created.barcode);
      if (original?.initial_quantity && original.warehouse_id) {
        stockToInsert.push({
          product_id: created.id,
          warehouse_id: original.warehouse_id,
          quantity: original.initial_quantity,
          ...branchDefaults,
        });
      }
    }

    if (stockToInsert.length > 0) {
      const { error: stockError } = await supabase
        .from("product_stocks")
        .insert(stockToInsert);

      if (stockError) {
        console.error("Bulk stock creation failed:", stockError);
      }
    }
  }

  revalidatePath("/inventory");
  revalidatePath("/warehouses");
  return {
    success: true,
    count: validatedProducts.length,
    skipped: errors.length,
    details: errors,
  };
}
