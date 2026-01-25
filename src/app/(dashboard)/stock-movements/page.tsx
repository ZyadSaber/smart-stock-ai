import { getStockMovementsPageData } from "@/services/stock-movements";
import { resolvePageData } from "@/lib/page-utils";
import { StockMovementsView } from "@/components/stock-movements/StockMovementsView";

interface StockMovementsPageProps {
    searchParams: Promise<{ organization_id?: string; branch_id?: string }>;
}

export default async function StockMovementsPage({ searchParams }: StockMovementsPageProps) {
    const result = await resolvePageData(searchParams, getStockMovementsPageData);

    if (result.error || !result.data) {
        return <div className="p-8 text-red-500">Error: {result.error || "Failed to load data"}</div>
    }

    const { movements, products, warehouses } = result.data;

    return (
        <div className="p-8">
            <StockMovementsView
                initialMovements={movements}
                products={products}
                warehouses={warehouses}
            />
        </div>
    );
}
