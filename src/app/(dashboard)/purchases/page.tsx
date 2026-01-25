import { getPurchasesPageData } from "@/services/purchases";
import { resolvePageData } from "@/lib/page-utils";
import { PurchasesView } from "@/components/purchases/PurchasesView";

interface PurchasesPageProps {
    searchParams: Promise<{
        organization_id?: string;
        branch_id?: string;
        date_from?: string;
        date_to?: string;
        supplier_id?: string;
        notes?: string;
    }>;
}

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
    const result = await resolvePageData(searchParams, getPurchasesPageData);

    if (result.error || !result.data) {
        return <div className="p-8 text-red-500">Error: {result.error || "Failed to load data"}</div>
    }

    const { purchaseOrders, products, warehouses, suppliers } = result.data;

    return (
        <div className="p-8">
            <PurchasesView
                initialPurchaseOrders={purchaseOrders}
                products={products}
                warehouses={warehouses}
                suppliers={suppliers}
            />
        </div>
    );
}
