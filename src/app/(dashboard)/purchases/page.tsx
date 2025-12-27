import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrderDialog } from "@/components/purchases/purchase-order-dialog";
import { getPurchaseOrders } from "./actions";
import { PurchaseHistoryTable } from "@/components/purchases/PurchaseHistoryTable";

export default async function PurchasesPage() {
    const supabase = await createClient();

    // Fetch products and warehouses for the dialog
    const { data: products } = await supabase
        .from('products')
        .select('id, name, cost_price')
        .order('name');

    const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');

    // Fetch purchase orders
    const purchaseOrders = await getPurchaseOrders();

    // Calculate summary stats
    const totalPurchases = purchaseOrders.length;
    const totalAmount = purchaseOrders.reduce((sum: number, po: any) => sum + parseFloat(po.total_amount || 0), 0);

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground">Record and track product purchases.</p>
                </div>
                <PurchaseOrderDialog
                    products={products || []}
                    warehouses={warehouses || []}
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPurchases}</div>
                        <p className="text-xs text-muted-foreground">
                            Purchase orders recorded
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total purchase value
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Purchase Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Purchase History</CardTitle>
                    <CardDescription>
                        All purchase orders and their details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PurchaseHistoryTable initialPurchaseOrders={purchaseOrders} />
                </CardContent>
            </Card>
        </div>
    );
}
