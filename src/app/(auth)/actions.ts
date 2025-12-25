"use server";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const {
    error,
    data: { user },
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }
  const { data } = await supabase
    .from("profiles")
    .select("default_page")
    .eq("id", user?.id)
    .single();
  return {
    success: true,
    default_page: data?.default_page,
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}
