"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { productSchema } from "@/lib/validations/product";

export async function createProductAction(values: any) {
  const supabase = await createClient();

  // 1. التحقق من الداتا مرة تانية على السيرفر (زيادة أمان)
  const validatedFields = productSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields provided." };
  }

  // 2. إدخال البيانات في Supabase
  const { data, error } = await supabase
    .from("products")
    .insert([validatedFields.data])
    .select();

  if (error) {
    console.error(error);
    return { error: "Database error: Could not create product." };
  }

  // 3. تحديث الكاش بتاع الصفحة عشان الجدول يقرأ الداتا الجديدة فوراً
  revalidatePath("/inventory");
  return { success: true };
}
