"use client"

import { useTransition, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/ui/select"
import { Search, RotateCcw, Loader2 } from "lucide-react"
import { PurchaseOrderDialog } from "./purchase-order-dialog"
import { PurchaseHistoryTable } from "./PurchaseHistoryTable"
import { useFormManager } from "@/hooks"
import { initialPurchasesData } from "@/components/reports/constants"
import { getPurchasesPageData } from "@/services/purchases"
import { resolveActionData } from "@/lib/page-utils"
import { PurchaseOrder, PurchaseProduct, Warehouse, Supplier } from "@/types/purchases"
import { formatEGP } from "@/lib/utils"

interface PurchasesViewProps {
    initialPurchaseOrders: PurchaseOrder[]
    products: PurchaseProduct[]
    warehouses: Warehouse[]
    suppliers: Supplier[]
}

export const PurchasesView = ({ initialPurchaseOrders, products, warehouses, suppliers }: PurchasesViewProps) => {
    const searchParams = useSearchParams()
    const [isLoading, startTransition] = useTransition()

    const { formData, handleFieldChange, handleChange, resetForm, handleChangeMultiInputs } = useFormManager({
        initialData: {
            ...initialPurchasesData,
            purchaseOrders: initialPurchaseOrders,
        }
    })

    const handleSearch = useCallback(() => {
        startTransition(async () => {
            const result = await resolveActionData<{ purchaseOrders: PurchaseOrder[] }>(
                getPurchasesPageData,
                searchParams,
                {
                    date_from: formData.date_from,
                    date_to: formData.date_to,
                    supplier_id: formData.supplier_id,
                    notes: formData.notes
                }
            );

            if (result) {
                handleChangeMultiInputs({
                    purchaseOrders: result.purchaseOrders
                });
            }
        });
    }, [formData.date_from, formData.date_to, formData.supplier_id, formData.notes, handleChangeMultiInputs, searchParams]);

    const handleReset = () => {
        resetForm()
        handleSearch()
    }

    // Calculate summary stats
    const totalPurchases = formData.purchaseOrders.length;
    const totalAmount = formData.purchaseOrders.reduce((sum: number, po: PurchaseOrder) => sum + parseFloat(po.total_amount || '0'), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground">Record and track product purchases.</p>
                </div>
                <PurchaseOrderDialog
                    products={products}
                    warehouses={warehouses}
                    suppliers={suppliers}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPurchases}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Purchase orders recorded
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEGP(totalAmount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total purchase value
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search Container */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Search Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <Input
                            type="date"
                            label="Date From"
                            name="date_from"
                            value={formData.date_from || ""}
                            onChange={handleChange}
                        />
                        <Input
                            type="date"
                            label="Date To"
                            name="date_to"
                            value={formData.date_to || ""}
                            onChange={handleChange}
                        />
                        <SelectField
                            label="Supplier"
                            name="supplier_id"
                            options={[{ key: "all", label: "All Suppliers" }, ...suppliers]}
                            value={formData.supplier_id}
                            onValueChange={(val) => handleFieldChange({ name: "supplier_id", value: val })}
                            placeholder="All Suppliers"
                            showSearch
                        />
                        <Input
                            label="Notes"
                            name="notes"
                            placeholder="Filter by notes..."
                            value={formData.notes || ""}
                            onChange={handleChange}
                        />
                        <div className="flex gap-2 flex-wrap md:col-span-4 justify-end">
                            <Button
                                className="bg-primary hover:bg-primary/90 min-w-[120px]"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 mr-2" />
                                )}
                                Research
                            </Button>
                            <Button
                                variant="outline"
                                className="min-w-[100px]"
                                onClick={handleReset}
                                disabled={isLoading}
                                title="Clear Filters"
                            >
                                <RotateCcw className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Clear</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Purchase Orders Table */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                <CardHeader>
                    <CardTitle>Purchase History</CardTitle>
                    <CardDescription>
                        All purchase orders and their details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Searching purchases...</p>
                        </div>
                    ) : (
                        <PurchaseHistoryTable
                            suppliers={suppliers}
                            initialPurchaseOrders={formData.purchaseOrders}
                            products={products}
                            warehouses={warehouses}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
