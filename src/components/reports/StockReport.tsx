"use client"

import { memo, useMemo, useTransition, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SelectField } from "@/components/ui/select"
import {
    Search,
    Boxes,
    AlertTriangle,
    History,
    Loader2,
    RotateCcw,
    TrendingUp,
    WarehouseIcon,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react"
import { useFormManager } from "@/hooks"
import { formatEGP } from "@/lib/utils"
import { getStockReportAction, getStockReportCardsData } from "@/services/reports"
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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

import {
    SalesHistoryItem,
    StockReportProps
} from "@/types/reports"

import { initialStockReportData } from "./constants"

import LoadingIcon from "./LoadingIcon"
import dynamic from "next/dynamic";

const StockPDFButton = dynamic(() => import("./StockPDFButton"), {
    ssr: false,
    loading: () => <Button disabled variant="outline" className="flex-1"><Loader2 className="animate-spin h-4 w-4" /></Button>
});

const StockReport = ({ products, warehouses }: StockReportProps) => {
    const searchParams = useSearchParams()
    const [isLoading, startTransition] = useTransition();

    const { formData, handleFieldChange, resetForm, handleChangeMultiInputs } = useFormManager({
        initialData: initialStockReportData
    })

    const handleSearch = useCallback(() => {
        startTransition(async () => {
            const filters = {
                product_id: formData.product_id,
                warehouse_id: formData.warehouse_id
            };

            const [reportData, cardsData] = await Promise.all([
                resolveActionData(getStockReportAction, searchParams, filters),
                resolveActionData(getStockReportCardsData, searchParams, filters)
            ]);

            const updates: Record<string, unknown> = {};
            if (reportData) {
                updates.stocks = reportData.stocks;
                updates.movements = reportData.movements;
                updates.salesHistory = reportData.salesHistory;
            }
            if (cardsData) {
                updates.cardsData = cardsData;
            }

            if (Object.keys(updates).length > 0) {
                handleChangeMultiInputs(updates);
            }
        });
    }, [formData.product_id, formData.warehouse_id, handleChangeMultiInputs, searchParams]);

    const chartData = useMemo(() => {
        return formData.cardsData?.warehouseStats.map(w => ({
            name: w.name,
            Stock: w.items_quantity,
            Value: w.total_products
        })) || []
    }, [formData.cardsData]);

    return (
        <div className="space-y-6">
            {/* Search Container */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Inventory Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <SelectField
                            label="Product"
                            name="product_id"
                            options={products}
                            value={formData.product_id}
                            onValueChange={(val) => handleFieldChange({ name: "product_id", value: val })}
                            placeholder="All Products"
                            showSearch
                        />
                        <SelectField
                            label="Warehouse"
                            name="warehouse_id"
                            options={warehouses}
                            value={formData.warehouse_id}
                            onValueChange={(val) => handleFieldChange({ name: "warehouse_id", value: val })}
                            placeholder="All Warehouses"
                            showSearch
                        />
                        <div className="flex items-end gap-2 flex-wrap">
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
                                onClick={resetForm}
                                disabled={isLoading}
                            >
                                <RotateCcw className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Clear</span>
                            </Button>
                            <StockPDFButton data={formData} isLoading={isLoading} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard Cards Row */}
            <div className="grid gap-4 md:grid-cols-4">
                {/* 1. Global Stock Summary */}
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md gap-1">
                    {isLoading ?
                        <LoadingIcon />
                        :
                        <>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <WarehouseIcon className="h-3 w-3 text-blue-500" />
                                    Current Stock Value
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <div className="space-y-2">
                                        {formData.cardsData?.warehouseStats.map((w, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b border-white/5 last:border-0">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold">{w.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{w.total_products} items</span>
                                                </div>
                                                <span className="text-xs font-bold text-blue-500">{formatEGP(w.items_quantity)}</span>
                                            </div>
                                        ))}
                                        {!formData.cardsData && (
                                            <div className="py-4 text-center text-[10px] text-muted-foreground italic">Fetch data to see summary</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    }
                </Card>

                {/* 2. Top Items per Warehouse */}
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md gap-1">
                    {isLoading ?
                        <LoadingIcon />
                        :
                        <>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                    Top Warehouses Items
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <div className="space-y-2">
                                        {formData.cardsData?.topItems.map((w, idx) => (
                                            <div key={idx} className="space-y-1 flex justify-between text-[10px] items-center">
                                                <span className="text-[14px] font-bold text-muted-foreground uppercase">{w.warehouse_name}</span>
                                                <span className="font-bold text-emerald-500">{w.product_name} x{w.total_quantity_sold}</span>
                                            </div>
                                        ))}
                                        {!formData.cardsData && (
                                            <div className="py-4 text-center text-[10px] text-muted-foreground italic">Fetch data to see summary</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    }
                </Card>

                {/* 3. Low Stock Items */}
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md gap-1">
                    {isLoading ?
                        <LoadingIcon />
                        :
                        <>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                                    Low Stock Alert
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <div className="space-y-1">
                                        {formData.cardsData?.lowStock.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[11px]">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{item.product_name}</span>
                                                    <span className="text-[9px] text-muted-foreground">{item.warehouse_name}</span>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] bg-orange-500/10 text-orange-600 border-orange-500/20">{item.stock_level}</Badge>
                                            </div>
                                        ))}
                                        {formData.cardsData?.lowStock.length === 0 && (
                                            <div className="py-4 text-center text-[10px] text-muted-foreground italic">All good!</div>
                                        )}
                                        {!formData.cardsData && (
                                            <div className="py-4 text-center text-[10px] text-muted-foreground italic">No data</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    }
                </Card>

                {/* 4. Latest Sold Items */}
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md gap-1">
                    {isLoading ?
                        <LoadingIcon />
                        :
                        <>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-3 w-3 text-primary" />
                                    Latest 6 Sold
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    <div className="space-y-1">
                                        {formData.cardsData?.latestSales.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-semibold truncate">{item.product_name}</span>
                                                    <span className="text-[8px] text-muted-foreground">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-primary">x{item.quantity}</span>
                                            </div>
                                        ))}
                                        {!formData.cardsData && (
                                            <div className="py-4 text-center text-[10px] text-muted-foreground italic">No data</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </>
                    }
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stock Data Table */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden">
                        <CardHeader className="pb-0 pt-6 px-6">
                            <CardTitle className="text-lg font-semibold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Boxes className="h-5 w-5 text-primary" />
                                    Stock Levels
                                </div>
                                <Badge variant="secondary" className="text-[10px]">{formData.stocks.length} Products Found</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 pt-0">
                            <div className="max-h-[500px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                <Table>
                                    <TableHeader className="bg-muted/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead className="bg-transparent">Product</TableHead>
                                            <TableHead className="bg-transparent">Warehouse</TableHead>
                                            <TableHead className="text-right bg-transparent">Quantity</TableHead>
                                            <TableHead className="text-right bg-transparent">Unit Cost</TableHead>
                                            <TableHead className="text-right bg-transparent">Total Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : formData.stocks.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                    No stock data found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            formData.stocks.map((s) => (
                                                <TableRow key={s.id} className="hover:bg-muted/20 transition-colors border-b border-white/5 last:border-0">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{s.product_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{s.barcode}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{s.warehouse_name}</TableCell>
                                                    <TableCell className="text-right font-mono font-bold">
                                                        <span className={s.quantity < 5 ? "text-orange-600" : ""}>{s.stock_level}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">{formatEGP(s.last_cost || 0)}</TableCell>
                                                    <TableCell className="text-right font-bold text-primary">{formatEGP(s.total_inventory_value)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stock Movements */}
                    <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden">
                        <CardHeader className="pb-0 pt-6 px-6">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Recent Movements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 pt-4">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Path</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : formData.movements.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                No movements data found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        formData.movements.map((m) => (
                                            <TableRow key={m.id} className="text-xs">
                                                <TableCell>
                                                    {!m.from_warehouse_id && m.to_warehouse_id ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none flex items-center w-fit gap-1">
                                                            <ArrowDownLeft className="h-3 w-3" /> IN
                                                        </Badge>
                                                    ) : m.from_warehouse_id && !m.to_warehouse_id ? (
                                                        <Badge className="bg-orange-500/10 text-orange-600 border-none flex items-center w-fit gap-1">
                                                            <ArrowUpRight className="h-3 w-3" /> OUT
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="flex items-center w-fit gap-1">TRANSFER</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{m.product_name}</TableCell>
                                                <TableCell className="text-[10px]">
                                                    {m.from_warehouse_name || "System"} → {m.to_warehouse_name || "Customer/Supplier"}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">{m.quantity}</TableCell>
                                                <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                                                    {new Date(m.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Sales History & Profitability */}
                    <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md overflow-hidden">
                        <CardHeader className="pb-0 pt-6 px-6">
                            <CardTitle className="text-lg font-semibold flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                    Sales History & Profitability
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 border-none">
                                        Recent Profit: {formatEGP(formData.salesHistory.reduce((sum: number, s: SalesHistoryItem) => sum + s.profit, 0))}
                                    </Badge>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 pt-4">
                            <div className="max-h-[400px] overflow-y-auto relative scrollbar-thin scrollbar-thumb-muted-foreground/20">
                                <Table>
                                    <TableHeader className="bg-muted/90 backdrop-blur-sm sticky top-0 z-10 shadow-sm text-[11px]">
                                        <TableRow>
                                            <TableHead className="bg-transparent">Product / Date</TableHead>
                                            <TableHead className="text-right bg-transparent">Qty</TableHead>
                                            <TableHead className="text-right bg-transparent">Unit Cost</TableHead>
                                            <TableHead className="text-right bg-transparent">Unit Price</TableHead>
                                            <TableHead className="text-right bg-transparent">Total Sales</TableHead>
                                            <TableHead className="text-right bg-transparent">Profit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : formData.salesHistory.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">No sales history found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            formData.salesHistory.map((s) => (
                                                <TableRow key={s.id} className="hover:bg-muted/20 transition-colors border-b border-white/5 last:border-0 text-xs">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{s.product_name}</span>
                                                            <span className="text-[10px] text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">{s.quantity}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{formatEGP(s.cost_price)}</TableCell>
                                                    <TableCell className="text-right">{formatEGP(s.unit_price)}</TableCell>
                                                    <TableCell className="text-right font-bold text-primary">{formatEGP(s.total_sales)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={s.profit >= 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                                                            {formatEGP(s.profit)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-md font-semibold">Stock Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="Stock" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={[
                                                    '#3b82f6', // blue-500
                                                    '#10b981', // emerald-500
                                                    '#f59e0b', // amber-500
                                                    '#8b5cf6', // violet-500
                                                    '#ec4899', // pink-500
                                                    '#06b6d4', // cyan-500
                                                ][index % 6]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
                                    No data to display chart
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-black/5 bg-primary/10 backdrop-blur-md outline-1 outline-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/20 rounded-full text-primary">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-primary">Total Inventory Value</p>
                                    <p className="text-2xl font-bold">
                                        {formatEGP(formData.cardsData?.warehouseStats.reduce((sum, w) => sum + w.total_stock_valuation, 0) || 0)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default memo(StockReport)
