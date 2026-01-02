import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrderDialog } from "@/components/purchases/purchase-order-dialog";
import { PurchaseHistoryTable } from "@/components/purchases/PurchaseHistoryTable";
import { formatEGP } from "@/lib/utils";
import { getPurchasesPageData } from "@/services/purchases";
import { resolvePageData } from "@/lib/page-utils";
import { PurchaseOrder } from "@/types/purchases";


interface PurchasesPageProps {
    searchParams: Promise<{ organization_id?: string; branch_id?: string }>;
}

export default async function PurchasesPage({ searchParams }: PurchasesPageProps) {
    const { purchaseOrders, products, warehouses } = await resolvePageData(searchParams, getPurchasesPageData);


    // Calculate summary stats
    const totalPurchases = purchaseOrders.length;
    const totalAmount = purchaseOrders.reduce((sum: number, po: PurchaseOrder) => sum + parseFloat(po.total_amount || '0'), 0);

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
                    <p className="text-muted-foreground">Record and track product purchases.</p>
                </div>
                <PurchaseOrderDialog
                    products={products}
                    warehouses={warehouses}
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

            {/* Purchase Orders Table */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
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
