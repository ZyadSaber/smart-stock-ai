"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  categorySchema,
  type CategoryFormInput,
} from "@/lib/validations/category";

export async function createCategoryAction(values: CategoryFormInput) {
  const supabase = await createClient();

  const validatedFields = categorySchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("categories")
    .insert([validatedFields.data])
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create category." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function updateCategoryAction(
  id: string,
  values: CategoryFormInput
) {
  const supabase = await createClient();

  const validatedFields = categorySchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("categories")
    .update(validatedFields.data)
    .eq("id", id)
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update category." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();

  // First check if category has products
  const { data: products, error: checkError } = await supabase
    .from("products")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  if (checkError) {
    console.error(checkError);
    return { error: "Database error: Could not check category usage." };
  }

  if (products && products.length > 0) {
    return {
      error:
        "Cannot delete category that has products. Please reassign or delete the products first.",
    };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete category." };
  }

  revalidatePath("/inventory");
  return { success: true };
}
