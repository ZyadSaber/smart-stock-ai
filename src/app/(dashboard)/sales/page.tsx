import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleOrderDialog } from "@/components/sales/sale-order-dialog";
import { SalesHistoryTable } from "@/components/sales/SalesHistoryTable";
import { formatEGP } from "@/lib/utils";
import { getSalesPageData } from "@/services/sales";
import { resolvePageData } from "@/lib/page-utils";


interface SalesPageProps {
    searchParams: Promise<{ organization_id?: string; branch_id?: string }>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
    const { sales, products, warehouses } = await resolvePageData(searchParams, getSalesPageData);


    // Calculate summary stats
    const totalSalesCount = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit_amount || 0), 0);

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
                    <p className="text-muted-foreground">Manage customer sales and track revenue.</p>
                </div>
                <SaleOrderDialog
                    products={products}
                    warehouses={warehouses}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
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
                <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md text-green-600">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEGP(totalProfit)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Net earnings after costs
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sales History Table */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                <CardHeader>
                    <CardTitle>Sales History</CardTitle>
                    <CardDescription>
                        All completed sales and their breakdowns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SalesHistoryTable initialSales={sales} />
                </CardContent>
            </Card>
        </div>
    );
}
