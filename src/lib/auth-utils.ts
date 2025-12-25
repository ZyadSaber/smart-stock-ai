import { createClient } from "@/utils/supabase/server";

export async function getFullUser() {
  const supabase = await createClient();

  // 1. جلب اليوزر من الـ Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 2. جلب البروفايل والصلاحيات
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    ...user,
    profile: profile || null,
  };
}
