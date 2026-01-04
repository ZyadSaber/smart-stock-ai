"use client";

import { ExcelImportModal } from "@/components/shared/excel-import-modal";
import { bulkUpdateStockAction } from "@/app/(dashboard)/warehouses/actions";
import { toast } from "sonner";
import { useTransition } from "react";

interface StockImportButtonProps {
    warehouseId: string;
    warehouseName: string
}

export function StockImportButton({
    warehouseId,
    warehouseName
}: StockImportButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleImport = (rawData: Record<string, unknown>[]) => {
        startTransition(async () => {
            const updates = rawData.map(row => {
                // Map fields robustly
                const productId = (row.product_id || row.productId || row.id || "") as string;
                const barcode = (row.barcode || row.Barcode || row.sku || row.SKU || "") as string;
                const quantity = Number(row.quantity || row.Quantity || row.stock || row.Stock || 0);

                return {
                    product_id: productId,
                    barcode: barcode,
                    quantity: quantity,
                    warehouse_id: warehouseId,
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
            title={`Import Stock: ${warehouseName}`}
            description="Upload an Excel file with Barcode and Quantity."
            triggerButtonText="Import Stock"
            triggerButtonClassName={isPending ? "opacity-50 pointer-events-none" : ""}
        />
    );
}
