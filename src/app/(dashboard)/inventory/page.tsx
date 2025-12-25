import { getInventoryData } from '@/services/inventory';
import { createClient } from "@/utils/supabase/server";
import { ProductDialog } from '@/components/inventory/product-dialog';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { CategoriesManagementModal } from '@/components/inventory/categories-management-modal';

export default async function InventoryPage() {
    const products = await getInventoryData();
    const supabase = await createClient();
    const { data: categories } = await supabase.from('categories').select('id, name');

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">Manage your products and stock levels.</p>
                </div>
                <div className="flex gap-2">
                    <CategoriesManagementModal categories={categories || []} />
                    <ProductDialog categories={categories || []} />
                </div>
            </div>

            <InventoryTable products={products} categories={categories || []} />
        </div>
    );
}