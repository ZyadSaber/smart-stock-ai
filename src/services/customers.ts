"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  customerSchema,
  type CustomerFormInput,
} from "@/lib/validations/customer";
import { getTenantContext, getOrganizationDefaults } from "@/lib/tenant";

export async function createCustomerAction(values: CustomerFormInput) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  const validatedFields = customerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  const { data, error } = await supabase
    .from("customers")
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
    return { error: "Database error: Could not create customer." };
  }

  revalidatePath("/customers");
  return { success: true, data };
}
