import { createClient } from "@/utils/supabase/server";
import { getTenantContext, applyOrganizationFilter } from "@/lib/tenant";

export async function getInventoryData(
  searchParams: { organization_id?: string; branch_id?: string } = {}
) {
  const context = await getTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  // Determine effectively active filters
  let activeOrgId: string | undefined = undefined;
  let activeBranchId: string | undefined = undefined;

  if (context.isSuperAdmin) {
    activeOrgId = searchParams.organization_id;
    activeBranchId = searchParams.branch_id;
  } else {
    activeOrgId = context.organizationId || undefined;
    activeBranchId = context.branchId || undefined;
  }

  let query = supabase.from("products").select(`
      id,
      name,
      barcode,
      cost_price,
      selling_price,
      category_id,
      categories (name),
      product_stocks (quantity, branch_id)
    `);

  // Apply organization level filter
  if (context.isSuperAdmin && activeOrgId) {
    query = query.eq("organization_id", activeOrgId);
  } else {
    query = applyOrganizationFilter(query, context);
  }

  const { data: productsData, error } = await query;
  if (error) throw error;

  const products = (productsData || []).map(
    ({
      id,
      name,
      barcode,
      cost_price,
      selling_price,
      category_id,
      categories,
      product_stocks,
    }) => {
      interface StockItem {
        quantity: number;
        branch_id: string | null;
      }
      interface CategoryItem {
        name: string;
      }

      const stocks = (product_stocks as unknown as StockItem[]) || [];
      const filteredStocks = context.isSuperAdmin
        ? activeBranchId
          ? stocks.filter((s) => s.branch_id === activeBranchId)
          : stocks
        : stocks.filter((s) => s.branch_id === context.branchId);

      const totalStock = filteredStocks.reduce(
        (acc, curr) => acc + (curr.quantity || 0),
        0
      );

      const catData = categories as unknown;
      const categoryName = Array.isArray(catData)
        ? (catData[0] as CategoryItem)?.name
        : (catData as CategoryItem)?.name;

      return {
        id: id,
        name: name,
        barcode: barcode,
        cost_price: Number(cost_price),
        selling_price: Number(selling_price),
        category_id: category_id,
        category: categoryName || "Uncategorized",
        price: Number(selling_price),
        stock: totalStock,
      };
    }
  );

  // 2. Fetch Categories for filters/dialogs
  let categoriesQuery = supabase.from("categories").select("id, name");

  if (context.isSuperAdmin && activeOrgId) {
    categoriesQuery = categoriesQuery.eq("organization_id", activeOrgId);
  } else {
    categoriesQuery = applyOrganizationFilter(categoriesQuery, context);
  }

  const { data: categories } = await categoriesQuery.order("name");

  return {
    products,
    categories: categories || [],
    context,
  };
}
