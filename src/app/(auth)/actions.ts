"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // النجاح لا يرجع شيء أو يرجع success
  return { success: true };
}

// export async function logout() {
//   const supabase = await createClient();

//   // 1. إنهاء الجلسة في سوبابيز (بيمسح الكوكيز تلقائياً)
//   const { error } = await supabase.auth.signOut();

//   if (error) {
//     console.error("Logout error:", error.message);
//     return { error: "Failed to log out" };
//   }

//   // // 2. تحديث الكاش عشان الميدل وير يحس إن مفيش يوزر
//   // revalidatePath("/", "layout");

//   // // 3. التوجيه لصفحة اللوجين (الروت)
//   // redirect("/");
// }

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // بدلاً من redirect('/') هنا، ممكن نرجع success
  return { success: true };
}
