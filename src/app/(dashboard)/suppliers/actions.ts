"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  supplierSchema,
  type SupplierFormInput,
} from "@/lib/validations/supplier";
import { getTenantContext, getOrganizationDefaults } from "@/lib/tenant";

export async function createSupplierAction(values: SupplierFormInput) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = supplierSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert([
      {
        ...validatedFields.data,
        ...getOrganizationDefaults(context),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create supplier." };
  }

  revalidatePath("/purchases");
  return { success: true, data };
}
