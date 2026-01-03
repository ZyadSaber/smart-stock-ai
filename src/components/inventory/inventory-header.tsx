"use client";

import { CategoriesManagementModal } from "@/components/inventory/categories-management-modal";
import { ProductDialog } from "@/components/inventory/product-dialog";
import { ExcelImportModal } from "@/components/shared/excel-import-modal";
import { toast } from "sonner";
import { useTransition } from "react";
import { bulkCreateProductsAction } from "@/app/(dashboard)/inventory/actions";

interface InventoryHeaderProps {
    categories: { id: string; name: string }[];
}

export function InventoryHeader({ categories }: InventoryHeaderProps) {
    const [isPending, startTransition] = useTransition();

    const handleExcelImport = (rawData: Record<string, unknown>[]) => {
        startTransition(async () => {
            // Map the raw data to match the product schema
            // We'll try to guess based on common column names
            const productsToImport = rawData.map(row => {
                // Find category ID by name if provided
                const categoryName = (row.category || row.Category || row.department || "") as string;
                const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());

                return {
                    name: (row.name || row.Name || row.product || row.Product || "") as string,
                    barcode: String(row.barcode || row.Barcode || row.sku || row.SKU || ""),
                    cost_price: Number(row.cost_price || row.Cost || row.cost || 0),
                    selling_price: Number(row.selling_price || row.Price || row.price || 0),
                    category_id: category?.id || categories[0]?.id || "" // Fallback to first category if not found
                };
            });

            const result = await bulkCreateProductsAction(productsToImport);

            if (result.error) {
                toast.error(result.error, {
                    description: result.details?.[0],
                    duration: 5000,
                });
            } else {
                toast.success(`Successfully imported ${result.count} products!`, {
                    description: (result.skipped ?? 0) > 0 ? `${result.skipped ?? 0} items were skipped due to invalid data.` : undefined,
                    duration: 5000,
                });
            }
        });
    };

    return (
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                <p className="text-muted-foreground">Manage your products and stock levels.</p>
            </div>
            <div className="flex gap-2">
                <ExcelImportModal
                    onDataImport={handleExcelImport}
                    title="Import Products"
                    description="Upload an Excel file with product names, SKU, cost, and price."
                    triggerButtonClassName={isPending ? "opacity-50 pointer-events-none" : ""}
                />
                <CategoriesManagementModal categories={categories} />
                <ProductDialog categories={categories} />
            </div>
        </div>
    );
}
