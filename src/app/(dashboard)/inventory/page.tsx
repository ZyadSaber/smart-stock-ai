import { getInventoryData } from '@/services/inventory';
import { InventoryTable } from '@/components/inventory/inventory-table';
import { resolvePageData } from '@/lib/page-utils';
import { InventoryHeader } from '@/components/inventory/inventory-header';

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{ organization_id?: string; branch_id?: string }>;
}) {
    const {
        products,
        categories,
        warehouses,
    } = await resolvePageData(searchParams, getInventoryData);

    return (
        <div className="p-8 space-y-6">
            <InventoryHeader categories={categories || []} warehouses={warehouses || []} />

            <InventoryTable products={products} categories={categories || []} />
        </div>
    );
}