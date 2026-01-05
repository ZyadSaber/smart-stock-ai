import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WarehouseDialog } from "@/components/warehouses/warehouse-dialog";
import { DeleteWarehouseDialog } from "@/components/warehouses/delete-warehouse-dialog";
import { StockImportButton } from "@/components/warehouses/stock-import-button";
import { WarehouseWithStats } from "@/services/warehouses";

interface WarehouseSummaryCardsProps {
    warehouses: WarehouseWithStats[];
}

export function WarehouseSummaryCards({ warehouses }: WarehouseSummaryCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {warehouses.map((warehouse) => (
                <Card key={warehouse.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-semibold">{warehouse.name}</CardTitle>
                                {warehouse.branch_id === null && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                        Shared
                                    </span>
                                )}
                            </div>
                            <CardDescription className="text-xs">
                                {warehouse.id}
                            </CardDescription>
                        </div>
                        <div className="flex gap-1">
                            <StockImportButton
                                warehouseId={warehouse.id}
                                warehouseName={warehouse.name}
                            />
                            <WarehouseDialog warehouse={warehouse} />
                            <DeleteWarehouseDialog
                                warehouseId={warehouse.id}
                                warehouseName={warehouse.name}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-3">
                            {warehouse.location || "No location specified"}
                        </CardDescription>
                        <div className="flex gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Products</p>
                                <p className="text-2xl font-bold">{warehouse.total_products}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total Units</p>
                                <p className="text-2xl font-bold">{warehouse.items_quantity}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
            }
        </div >
    );
}
