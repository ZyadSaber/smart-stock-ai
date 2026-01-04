"use client";

import { ExcelImportModal } from "@/components/shared/excel-import-modal";
import { bulkUpdateStockAction } from "@/app/(dashboard)/warehouses/actions";
import { toast } from "sonner";
import { useTransition } from "react";

interface StockImportButtonProps {
    warehouses: { id: string; name: string }[];
}

export function StockImportButton({ warehouses }: StockImportButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleImport = (rawData: Record<string, unknown>[]) => {
        startTransition(async () => {
            const updates = rawData.map(row => {
                const warehouseName = (row.warehouse || row.Warehouse || row.store || row.Store || "") as string;
                const warehouse = warehouses.find(w => w.name.toLowerCase() === warehouseName.toLowerCase());

                return {
                    barcode: String(row.barcode || row.Barcode || row.sku || row.SKU || ""),
                    warehouse_id: warehouse?.id || warehouses[0]?.id || "",
                    quantity: Number(row.quantity || row.Quantity || row.stock || row.Stock || 0)
                };
            });

            const result = await bulkUpdateStockAction(updates);

            if (result.success) {
                toast.success(`Successfully updated stock for ${result.count} products!`);
                if (result.errors && result.errors.length > 0) {
                    toast.warning(`${result.errors.length} updates failed. Check console for details.`);
                    console.error("Stock import errors:", result.errors);
                }
            } else {
                toast.error("Failed to update stock.", {
                    description: result.errors?.[0]
                });
            }
        });
    };

    return (
        <ExcelImportModal
            onDataImport={handleImport}
            title="Import Stock Levels"
            description="Upload an Excel file with Barcode, Warehouse Name, and Quantity."
            triggerButtonText="Import Stock"
            triggerButtonClassName={isPending ? "opacity-50 pointer-events-none" : ""}
        />
    );
}
