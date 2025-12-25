"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/validations/product";
import type { z } from "zod";

export type ProductFormInput = z.input<typeof productSchema>;

export async function createProductAction(values: ProductFormInput) {
  const supabase = await createClient();

  const validatedFields = productSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("products")
    .insert([validatedFields.data])
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
  const supabase = await createClient();

  const validatedFields = productSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("products")
    .update(validatedFields.data)
    .eq("id", id)
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update product." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteProductAction(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete product." };
  }

  revalidatePath("/inventory");
  return { success: true };
}
