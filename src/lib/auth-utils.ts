import { createClient } from "@/utils/supabase/server";

export async function getFullUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `
      *,
      organizations:organization_id (name),
      branches:branch_id (name)
    `
    )
    .eq("id", user.id)
    .single();

  return {
    ...user,
    profile: profile || null,
  };
}
