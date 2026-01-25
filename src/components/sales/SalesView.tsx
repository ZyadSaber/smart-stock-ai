"use client"

import { useTransition, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/ui/select"
import { Search, RotateCcw, Loader2 } from "lucide-react"
import { SaleOrderDialog } from "./sale-order-dialog"
import { SalesHistoryTable } from "./SalesHistoryTable"
import { useFormManager } from "@/hooks"
import { initialSalesData } from "@/components/reports/constants"
import { getSalesPageData } from "@/services/sales"
import { resolveActionData } from "@/lib/page-utils"
import { Sale, SaleProduct, Warehouse, Customers } from "@/types/sales"
import { formatEGP } from "@/lib/utils"

interface SalesViewProps {
    initialSales: Sale[]
    products: SaleProduct[]
    warehouses: Warehouse[]
    customers: Customers[]
}

export const SalesView = ({ initialSales, products, warehouses, customers }: SalesViewProps) => {
    const searchParams = useSearchParams()
    const [isLoading, startTransition] = useTransition()

    const { formData, handleFieldChange, handleChange, resetForm, handleChangeMultiInputs } = useFormManager({
        initialData: {
            ...initialSalesData,
            sales: initialSales,
        }
    })

    const handleSearch = useCallback(() => {
        startTransition(async () => {
            const result = await resolveActionData<{ sales: Sale[] }>(
                getSalesPageData as any,
                searchParams,
                {
                    date_from: formData.date_from,
                    date_to: formData.date_to,
                    customer_id: formData.customer_id,
                    notes: formData.notes
                }
            );

            if (result) {
                handleChangeMultiInputs({
                    sales: result.sales
                });
            }
        });
    }, [formData.date_from, formData.date_to, formData.customer_id, formData.notes, handleChangeMultiInputs, searchParams]);

    const handleReset = () => {
        resetForm()
        handleSearch()
    }

    // Calculate summary stats
    const totalSalesCount = formData.sales.length;
    const totalRevenue = formData.sales.reduce((sum: number, s: Sale) => sum + Number(s.total_amount || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
                    <p className="text-muted-foreground">Manage customer sales and track revenue.</p>
                </div>
                <SaleOrderDialog
                    products={products}
                    warehouses={warehouses}
                    customers={customers}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSalesCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Transactions recorded
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEGP(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Gross value of all sales
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
                            label="Customer"
                            name="customer_id"
                            options={[{ key: "all", label: "All Customers" }, ...customers]}
                            value={formData.customer_id}
                            onValueChange={(val) => handleFieldChange({ name: "customer_id", value: val })}
                            placeholder="All Customers"
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
                                <div className="flex items-center">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    <span>Clear</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales History Table */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                <CardHeader>
                    <CardTitle>Sales History</CardTitle>
                    <CardDescription>
                        All completed sales and their breakdowns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Searching sales...</p>
                        </div>
                    ) : (
                        <SalesHistoryTable
                            initialSales={formData.sales}
                            products={products}
                            warehouses={warehouses}
                            customers={customers}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
