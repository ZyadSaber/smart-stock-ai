"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Notification } from "@/types/notifications";
import { getTenantContext, applyBranchFilter } from "@/lib/tenant";

export async function getNotifications(): Promise<Notification[]> {
  const context = await getTenantContext();
  if (!context) return [];

  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  query = applyBranchFilter(query, context);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data as Notification[];
}

export async function markAsReadAction(id: string) {
  const context = await getTenantContext();
  if (!context) return { error: "Unauthorized" };

  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  query = applyBranchFilter(query, context);

  const { error } = await query;

  if (error) {
    console.error("Error marking notification as read:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function markAllAsReadAction() {
  const context = await getTenantContext();
  if (!context) return { error: "Not authenticated" };

  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", context.userId)
    .eq("is_read", false);

  query = applyBranchFilter(query, context);

  const { error } = await query;

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
