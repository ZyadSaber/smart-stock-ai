"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  categorySchema,
  type CategoryFormInput,
} from "@/lib/validations/category";
import {
  getTenantContext,
  applyOrganizationFilter,
  getOrganizationDefaults,
} from "@/lib/tenant";

export async function createCategoryAction(values: CategoryFormInput) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = categorySchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { error } = await supabase
    .from("categories")
    .insert([
      {
        ...validatedFields.data,
        ...getOrganizationDefaults(context),
      },
    ])
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
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = categorySchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  let query = supabase
    .from("categories")
    .update(validatedFields.data)
    .eq("id", id);
  query = applyOrganizationFilter(query, context);

  const { error } = await query.select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not update category." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteCategoryAction(id: string) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  // First check if category has products
  let checkQuery = supabase
    .from("products")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  checkQuery = applyOrganizationFilter(checkQuery, context);

  const { data: products, error: checkError } = await checkQuery;

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

  let deleteQuery = supabase.from("categories").delete().eq("id", id);
  deleteQuery = applyOrganizationFilter(deleteQuery, context);

  const { error } = await deleteQuery;

  if (error) {
    console.error(error);
    return { error: "Database error: Could not delete category." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function bulkCreateCategoriesAction(
  categories: CategoryFormInput[]
) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();
  const orgDefaults = getOrganizationDefaults(context);

  const validatedCategories = [];
  const errors = [];

  for (const category of categories) {
    const validated = categorySchema.safeParse(category);
    if (validated.success) {
      validatedCategories.push({
        ...validated.data,
        ...orgDefaults,
      });
    } else {
      errors.push(
        `Category "${category.name || "Unknown"}": ${
          validated.error.issues[0]?.message || "Invalid data"
        }`
      );
    }
  }

  if (validatedCategories.length === 0) {
    return { error: "No valid categories found to import.", details: errors };
  }

  const { error } = await supabase
    .from("categories")
    .insert(validatedCategories)
    .select();

  if (error) {
    console.error(error);
    return {
      error: "Database error: Could not import categories.",
      details: [error.message],
    };
  }

  revalidatePath("/inventory");
  return {
    success: true,
    count: validatedCategories.length,
    skipped: errors.length,
    details: errors,
  };
}
