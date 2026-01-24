"use client"

import { memo, useMemo, useState, Fragment, useTransition, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/ui/select"
import {
    Search,
    TrendingUp,
    DollarSign,
    ChevronDown,
    ChevronRight,
    Clock,
    Loader2,
    Package,
    ShoppingCart,
    RotateCcw
} from "lucide-react"
import { useFormManager } from "@/hooks"
import { Supplier } from "@/types/purchases"
import { formatEGP } from "@/lib/utils"
import { getPurchaseReportAction, getPurchaseReportCardsData } from "@/services/reports"
import { resolveActionData } from "@/lib/page-utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { initialPurchaseReportData } from "./constants"

interface PurchaseReportProps {
    suppliers: Supplier[]
}

const PurchaseReport = ({ suppliers }: PurchaseReportProps) => {
    const searchParams = useSearchParams()
    const [isLoading, startTransition] = useTransition();

    const { formData, handleFieldChange, handleChange, resetForm } = useFormManager({
        initialData: initialPurchaseReportData
    })

    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleReset = () => {
        resetForm()
        setExpandedRows({})
    }

    const handleSearch = useCallback(() => {
        startTransition(async () => {
            const [purchasesData, cardsData] = await Promise.all([
                resolveActionData(getPurchaseReportAction, searchParams, formData),
                resolveActionData(getPurchaseReportCardsData, searchParams, formData)
            ]);

            if (purchasesData) handleFieldChange({ name: "purchases", value: purchasesData });
            if (cardsData) handleFieldChange({ name: "cardsData", value: cardsData });
        });
    }, [formData, handleFieldChange, searchParams]);

    const summary = useMemo(() => formData.purchases.reduce((acc, purchase) => ({
        totalPurchases: acc.totalPurchases + 1,
        totalSpending: acc.totalSpending + Number(purchase.total_amount),
    }), { totalPurchases: 0, totalSpending: 0 })
        , [formData.purchases])

    const lastPurchasedItems = useMemo(() => {
        return formData.purchases
            .flatMap(purchase => purchase.items_data.map(item => ({
                ...item,
                created_at: purchase.created_at
            })))
            .slice(0, 5);
    }, [formData.purchases]);

    return (
        <div className="space-y-6">
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
                            name="dateFrom"
                            value={formData.dateFrom}
                            onChange={handleChange}
                        />
                        <Input
                            type="date"
                            label="Date To"
                            name="dateTo"
                            value={formData.dateTo}
                            onChange={handleChange}
                        />

                        <SelectField
                            label="Supplier"
                            name="supplier_id"
                            options={suppliers}
                            value={formData.supplier_id}
                            onValueChange={(val) => handleFieldChange({ name: "supplier_id", value: val })}
                            placeholder="All Suppliers"
                            showSearch
                        />
                        <div className="flex gap-2">
                            <Button
                                className="flex-2 bg-primary hover:bg-primary/90"
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
                                className="flex-1"
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

            {/* Task Cards Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden outline-1 outline-white/5">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Purchase Frequency
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase">Today</p>
                                <p className="text-xl font-bold">{formData.cardsData?.stats?.today || 0}</p>
                            </div>
                            <div className="space-y-1 text-right border-l border-white/5 pl-4">
                                <p className="text-[10px] text-muted-foreground uppercase">Yesterday</p>
                                <p className="text-xl font-bold">{formData.cardsData?.stats?.yesterday || 0}</p>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-white/5">
                                <p className="text-[10px] text-muted-foreground uppercase">Last 15d</p>
                                <p className="text-xl font-bold">{formData.cardsData?.stats?.last15Days || 0}</p>
                            </div>
                            <div className="space-y-1 pt-2 text-right border-t border-l border-white/5 pl-4">
                                <p className="text-[10px] text-muted-foreground uppercase">Last 30d</p>
                                <p className="text-xl font-bold">{formData.cardsData?.stats?.last30Days || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden outline-1 outline-white/5">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Efficiency Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase">Avg. Value</p>
                                <p className="text-xl font-bold text-primary">{formatEGP(formData.cardsData?.additionalMetrics?.avgPurchaseValue || 0)}</p>
                            </div>
                            <div className="space-y-1 text-right border-l border-white/5 pl-4">
                                <p className="text-[10px] text-muted-foreground uppercase">Avg. Items</p>
                                <p className="text-xl font-bold text-primary">{(formData.cardsData?.additionalMetrics?.avgItemsPerInvoice || 0).toFixed(1)}</p>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-white/5 col-span-2">
                                <p className="text-[10px] text-muted-foreground uppercase">Top Supplier</p>
                                <p className="text-sm font-bold text-primary truncate max-w-full">{formData.cardsData?.additionalMetrics?.topSupplier || "N/A"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden outline-1 outline-white/5">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            Recent Items Purchased
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 px-3">
                        <div className="space-y-1">
                            {lastPurchasedItems.length > 0 ? (
                                lastPurchasedItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-semibold truncate text-foreground/90">{item.products?.name}</span>
                                            <span className="text-[9px] text-muted-foreground">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="text-right flex flex-col">
                                            <span className="text-[10px] font-bold text-primary">x{item.quantity}</span>
                                            <span className="text-[9px] text-muted-foreground">{formatEGP(item.unit_price)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-xs text-muted-foreground italic">
                                    No items found.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-none shadow-sm shadow-black/5 bg-blue-500/10 backdrop-blur-md outline-1 outline-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm text-blue-500 uppercase tracking-wider">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.totalPurchases}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Filtered purchase orders
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-orange-500/10 backdrop-blur-md outline-1 outline-orange-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm text-orange-500 uppercase tracking-wider">Total Spending</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatEGP(summary.totalSpending)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Gross purchase value
                        </p>
                    </CardContent>
                </Card>
            </div>


            {/* Orders Table */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">Searching orders...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : formData.purchases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                        No orders found matching criteria. Click Research to fetch results.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                formData.purchases.map((purchase) => (
                                    <Fragment key={purchase.id}>
                                        <TableRow className="hover:bg-muted/20 transition-colors">
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => toggleRow(purchase.id)}
                                                >
                                                    {expandedRows[purchase.id] ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{purchase.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{new Date(purchase.created_at).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(purchase.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {purchase.supplier_name}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatEGP(Number(purchase.total_amount))}
                                            </TableCell>
                                        </TableRow>
                                        {expandedRows[purchase.id] && (
                                            <TableRow className="bg-muted/5">
                                                <TableCell colSpan={6} className="p-0">
                                                    <div className="px-12 py-4 space-y-4">
                                                        <div className="grid grid-cols-2 gap-8">
                                                            <div className="space-y-2">
                                                                <h4 className="text-xs font-bold uppercase text-muted-foreground">Items Breakdown</h4>
                                                                <div className="space-y-2">
                                                                    {purchase.items_data.map((item, idx) => (
                                                                        <div key={idx} className="flex justify-between text-sm items-center border-b border-white/5 pb-1">
                                                                            <span>
                                                                                <span className="font-medium">{item.products?.name}</span>
                                                                                <span className="text-xs text-muted-foreground ml-2">x{item.quantity}</span>
                                                                            </span>
                                                                            <span className="font-mono text-xs">{formatEGP(item.unit_price * item.quantity)}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Notes</h4>
                                                                    <p className="text-sm text-muted-foreground border rounded-md p-2 bg-background/50 italic">
                                                                        {purchase.notes || "No notes for this order."}
                                                                    </p>
                                                                </div>
                                                                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                                                                    <span className="text-xs font-medium">Recorded By:</span>
                                                                    <Badge variant="outline" className="text-[10px]">{purchase.created_by_user || "System"}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default memo(PurchaseReport)