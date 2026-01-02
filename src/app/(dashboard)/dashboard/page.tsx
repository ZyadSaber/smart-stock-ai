import { getDashboardStats } from '@/services/dashboard';
import { getSales, getTopSellingProducts } from "@/app/(dashboard)/sales/actions";
import { getAllWarehousesValuation } from "@/app/(dashboard)/warehouses/actions";
import { getStockFlowData } from "@/app/(dashboard)/stock-movements/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesProfitChart } from "@/components/dashboard/sales-profit-chart";
import { WarehouseValuationChart } from "@/components/dashboard/warehouse-valuation-chart";
import { TopProductsChart } from "@/components/dashboard/top-products-chart";
import { StockFlowChart } from "@/components/dashboard/stock-flow-chart";
import { Package, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { formatEGP } from '@/lib/utils';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ organization_id?: string; branch_id?: string }>;
}) {
    const filters = await searchParams;
    const stats = await getDashboardStats(filters);
    const sales = await getSales(filters);
    const warehouseValuations = await getAllWarehousesValuation(filters);
    const topProducts = await getTopSellingProducts(filters);
    const stockFlow = await getStockFlowData(filters);



    // Currency formatting is now handled by formatEGP from utils

    const statusBoxes = [
        {
            title: 'Low Stock Alert',
            value: stats.low_stock_count,
            description: 'Items below 5 qty',
            color: 'bg-red-500/10 text-red-600 border-red-200',
            icon: Package
        },
        {
            title: 'Total Stock Value',
            value: formatEGP(stats.total_cost),
            description: 'Inventory at cost',
            color: 'bg-blue-500/10 text-blue-600 border-blue-200',
            icon: DollarSign
        },
        {
            title: "Today's Profit",
            value: formatEGP(stats.todays_profit),
            description: 'Net from today sales',
            color: 'bg-green-500/10 text-green-600 border-green-200',
            icon: TrendingUp
        },
    ];

    const kpiCards = [
        {
            title: 'Inventory Value (Market)',
            value: formatEGP(stats.total_revenue),
            icon: DollarSign,
            description: 'Estimated market value',
            color: 'text-green-500'
        },
        {
            title: 'Projected Total Profit',
            value: formatEGP(stats.projected_profit),
            icon: TrendingUp,
            description: 'Expected margin on stock',
            color: 'text-orange-500'
        },
    ];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
            </div>

            {/* Status Boxes (Small) */}
            <div className="grid gap-4 md:grid-cols-3">
                {statusBoxes.map((box) => (
                    <div key={box.title} className={`flex items-center p-3 rounded-lg border ${box.color} backdrop-blur-md`}>
                        <box.icon className="h-5 w-5 mr-3 shrink-0" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider opacity-80">{box.title}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-bold">{box.value}</h3>
                                <span className="text-[10px] opacity-70 whitespace-nowrap">{box.description}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {kpiCards.map((card) => (
                    <Card key={card.title} className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts & Recent Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <SalesProfitChart sales={sales} />
                </div>
                <div className="lg:col-span-3">
                    <WarehouseValuationChart data={warehouseValuations} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-3">
                    <TopProductsChart data={topProducts} />
                </div>
                <div className="lg:col-span-4">
                    <StockFlowChart data={stockFlow} />
                </div>
            </div>
        </div>
    );
}