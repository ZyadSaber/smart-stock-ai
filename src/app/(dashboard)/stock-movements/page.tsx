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
import { StockMovementDialog } from "@/components/stock-movements/stock-movement-dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package } from "lucide-react";
import { getStockMovements } from "./actions";

export default async function StockMovementsPage() {
    const supabase = await createClient();

    // Fetch products and warehouses for the dialog
    const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .order('name');

    const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');

    // Fetch stock movements
    const movements = await getStockMovements();

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
                    <p className="text-muted-foreground">Track stock transfers between warehouses.</p>
                </div>
                <StockMovementDialog
                    products={products || []}
                    warehouses={warehouses || []}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Movement History</CardTitle>
                    <CardDescription>
                        All stock transfers and movements are recorded here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            No stock movements recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    movements.map((movement: any) => (
                                        <TableRow key={movement.id}>
                                            <TableCell className="font-mono text-xs">
                                                {new Date(movement.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                    {movement.products?.name || 'Unknown'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {movement.from_warehouse?.name || 'New Stock'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {movement.to_warehouse?.name || 'Removed'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{movement.quantity}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {movement.notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {movement.created_by_user?.full_name || 'Unknown'}
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
