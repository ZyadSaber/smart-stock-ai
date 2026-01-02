// src/services/reports.ts

import { createClient } from "@/utils/supabase/server"; // تأكد إنك بتعمل import من ملف السيرفر
import { getTenantContext, applyBranchFilter } from "@/lib/tenant";

export async function getWarehouseSummary(warehouseId: string) {
  const context = await getTenantContext();
  if (!context) return null;

  // 1. لازم await هنا لأن createClient بقت async في التعديل اللي فات
  const supabase = await createClient();

  // Verify warehouse belongs to branch (unless super admin)
  if (!context.isSuperAdmin) {
    let checkQuery = supabase
      .from("warehouses")
      .select("id")
      .eq("id", warehouseId);
    checkQuery = applyBranchFilter(checkQuery, context);
    const { data: warehouse } = await checkQuery.maybeSingle();
    if (!warehouse) {
      console.warn("Unauthorized warehouse summary access attempt");
      return { total_cost: 0, total_revenue: 0, projected_profit: 0 };
    }
  }

  // 2. دلوقتي rpc هتكون متاحة عادي
  const { data, error } = await supabase.rpc("get_warehouse_valuation", {
    w_id: warehouseId,
  });

  if (error) {
    console.error("RPC Error:", error);
    return { total_cost: 0, total_revenue: 0, projected_profit: 0 };
  }

  return data ? data[0] : null;
}
