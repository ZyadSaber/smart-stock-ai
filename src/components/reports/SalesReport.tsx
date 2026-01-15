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
    Receipt,
    ChevronDown,
    ChevronRight,
    Clock,
    Loader2,
    Package
} from "lucide-react"
import { useFormManager } from "@/hooks"
import { Sale, Customers } from "@/types/sales"
import { formatEGP } from "@/lib/utils"
import { getSalesReportAction, getSalesReportCardsData } from "@/services/reports"
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
import { GenerateInvoiceButton } from "../sales/GenerateInvoiceButton"

interface SalesReportProps {
    customers: Customers[]
}

const SalesReport = ({ customers }: SalesReportProps) => {
    const searchParams = useSearchParams()
    const [isLoading, startTransition] = useTransition();


    const { formData, handleFieldChange, handleChange } = useFormManager({
        initialData: {
            dateFrom: "",
            dateTo: "",
            customer_id: "",
            sales: [] as Sale[],
            cardsData: null as {
                stats: Record<string, number>,
                summary: Record<string, number>,
                additionalMetrics: Record<string, number>
            } | null
        }
    })

    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleSearch = useCallback(() => {
        startTransition(async () => {
            const [salesData, cardsData] = await Promise.all([
                resolveActionData(getSalesReportAction, searchParams, formData),
                resolveActionData(getSalesReportCardsData, searchParams, formData)
            ]);

            if (salesData) handleFieldChange({ name: "sales", value: salesData });
            if (cardsData) handleFieldChange({ name: "cardsData", value: cardsData });
        });
    }, [formData, handleFieldChange, searchParams]);

    const summary = useMemo(() => formData.sales.reduce((acc, sale) => ({
        totalSales: acc.totalSales + 1,
        totalRevenue: acc.totalRevenue + Number(sale.total_amount),
        totalProfit: acc.totalProfit + Number(sale.profit_amount)
    }), { totalSales: 0, totalRevenue: 0, totalProfit: 0 })
        , [formData.sales])

    const lastSoldItems = useMemo(() => {
        return formData.sales
            .flatMap(sale => sale.items_data.map(item => ({
                ...item,
                created_at: sale.created_at
            })))
            .slice(0, 5);
    }, [formData.sales]);

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
                            label="Customer"
                            name="customer_id"
                            options={customers}
                            value={formData.customer_id}
                            onValueChange={(val) => handleFieldChange({ name: "customer_id", value: val })}
                            placeholder="All Customers"
                            showSearch
                        />
                        <Button
                            className="w-full bg-primary hover:bg-primary/90"
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
                    </div>
                </CardContent>
            </Card>

            {/* Task Cards Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden outline-1 outline-white/5">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Invoice Frequency
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
                            Performance Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase">Avg. Value</p>
                                <p className="text-xl font-bold text-primary">{formatEGP(formData.cardsData?.additionalMetrics?.avgInvoiceValue || 0)}</p>
                                <p className="text-[9px] text-muted-foreground italic">Overall History</p>
                            </div>
                            <div className="space-y-1 text-right border-l border-white/5 pl-4">
                                <p className="text-[10px] text-muted-foreground uppercase">Profit Margin</p>
                                <p className="text-xl font-bold text-green-600">{(formData.cardsData?.additionalMetrics?.profitMargin || 0).toFixed(1)}%</p>
                                <p className="text-[9px] text-muted-foreground italic">Net Efficiency</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden outline-1 outline-white/5">
                    <CardHeader className="pb-2 border-b border-white/5">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            Recent Items Sold
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2 px-3">
                        <div className="space-y-1">
                            {lastSoldItems.length > 0 ? (
                                lastSoldItems.map((item, idx) => (
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
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none shadow-sm shadow-black/5 bg-blue-500/10 backdrop-blur-md outline-1 outline-blue-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm text-blue-500 uppercase tracking-wider">Total Sales</CardTitle>
                        <Receipt className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{summary.totalSales}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Filtered transactions
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-green-500/10 backdrop-blur-md outline-1 outline-green-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm text-green-500 uppercase tracking-wider">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatEGP(summary.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Gross sales value
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm shadow-black/5 bg-purple-500/10 backdrop-blur-md outline-1 outline-purple-500/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm text-purple-500 uppercase tracking-wider">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{formatEGP(summary.totalProfit)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Net period earnings
                        </p>
                    </CardContent>
                </Card>
            </div>


            {/* Invoices Table */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Sales Invoices</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Invoice ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Profit</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm text-muted-foreground">Searching invoices...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : formData.sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                                        No invoices found matching criteria. Click Research to fetch results.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                formData.sales.map((sale) => (
                                    <Fragment key={sale.id}>
                                        <TableRow className="hover:bg-muted/20 transition-colors">
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => toggleRow(sale.id)}
                                                >
                                                    {expandedRows[sale.id] ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{sale.id.slice(0, 8)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{new Date(sale.created_at).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {sale.customer_name || "Walk-in Customer"}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatEGP(sale.total_amount)}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">
                                                +{formatEGP(sale.profit_amount)}
                                            </TableCell>
                                            <TableCell>
                                                <GenerateInvoiceButton sale={sale} />
                                            </TableCell>
                                        </TableRow>
                                        {expandedRows[sale.id] && (
                                            <TableRow className="bg-muted/5">
                                                <TableCell colSpan={7} className="p-0">
                                                    <div className="px-12 py-4 space-y-4">
                                                        <div className="grid grid-cols-2 gap-8">
                                                            <div className="space-y-2">
                                                                <h4 className="text-xs font-bold uppercase text-muted-foreground">Items Breakdown</h4>
                                                                <div className="space-y-2">
                                                                    {sale.items_data.map((item, idx) => (
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
                                                                        {sale.notes || "No notes for this invoice."}
                                                                    </p>
                                                                </div>
                                                                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                                                                    <span className="text-xs font-medium">Recorded By:</span>
                                                                    <Badge variant="outline" className="text-[10px]">{sale.created_by_user}</Badge>
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

export default memo(SalesReport)

