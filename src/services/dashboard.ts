import { createClient } from "@/utils/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // نفترض أننا نجلب إحصائيات المخزن الرئيسي حالياً
  const { data, error } = await supabase.rpc("get_warehouse_valuation", {
    w_id: "2b0716e2-be63-477f-afe3-cf4b5c869a58",
  });

  if (error) throw error;
  return data[0];
}
