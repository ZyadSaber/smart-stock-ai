// src/services/reports.ts

import { createClient } from "@/utils/supabase/server"; // تأكد إنك بتعمل import من ملف السيرفر

export async function getWarehouseSummary(warehouseId: string) {
  // 1. لازم await هنا لأن createClient بقت async في التعديل اللي فات
  const supabase = await createClient();

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
