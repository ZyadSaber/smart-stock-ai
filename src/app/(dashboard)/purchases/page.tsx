import { createClient } from "@/utils/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrderDialog } from "@/components/purchases/purchase-order-dialog";
import { Badge } from "@/components/ui/badge";
import { getPurchaseOrders } from "./actions";

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
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Total Amount</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Created By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No purchase orders recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchaseOrders.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">
                                                {new Date(order.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {order.supplier_name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    ${parseFloat(order.total_amount).toFixed(2)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                                {order.notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {order.created_by_user?.full_name || 'Unknown'}
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
    );
}
