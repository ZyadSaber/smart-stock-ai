import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleOrderDialog } from "@/components/sales/sale-order-dialog";
import { getSales } from "./actions";
import { SalesHistoryTable } from "@/components/sales/SalesHistoryTable";
import { formatEGP } from "@/lib/utils";

export default async function SalesPage() {
    const supabase = await createClient();

    // Fetch products and warehouses for the dialog
    const { data: products } = await supabase
        .from('products')
        .select('id, name, selling_price')
        .order('name');

    const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');

    // Fetch sales
    const sales = await getSales();

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
                    products={products || []}
                    warehouses={warehouses || []}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSalesCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Transactions recorded
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatEGP(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">
                            Gross value of all sales
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatEGP(totalProfit)}</div>
                        <p className="text-xs text-muted-foreground">
                            Net earnings after costs
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Sales History Table */}
            <Card>
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
