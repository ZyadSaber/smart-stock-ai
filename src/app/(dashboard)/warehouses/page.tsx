import { WarehouseDialog } from "@/components/warehouses/warehouse-dialog";
import { WarehouseSummaryCards } from "@/components/warehouses/warehouse-summary-cards";
import { StockMatrix } from "@/components/warehouses/stock-matrix";
import { getWarehousePageData } from "@/services/warehouses";
import { resolvePageData } from "@/lib/page-utils";

interface WarehousesPageProps {
    searchParams: Promise<{ organization_id?: string; branch_id?: string }>;
}

export default async function WarehousesPage({ searchParams }: WarehousesPageProps) {
    const {
        warehouses,
        products,
        stockMap,
        warehouseTotals,
    } = await resolvePageData(searchParams, getWarehousePageData);



    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
                    <p className="text-muted-foreground">Manage your warehouses and stock levels.</p>
                </div>
                <div className="flex items-center gap-4">
                    <WarehouseDialog />
                </div>
            </div>


            <WarehouseSummaryCards warehouses={warehouseTotals} />

            <StockMatrix
                products={products}
                warehouses={warehouses}
                stockMap={stockMap}
            />
        </div>
    );
}
