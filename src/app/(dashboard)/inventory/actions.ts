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

  const { error } = await supabase
    .from("products")
    .insert([
      {
        ...validatedFields.data,
        ...getOrganizationDefaults(context),
      },
    ])
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create product." };
  }

  revalidatePath("/inventory");
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
