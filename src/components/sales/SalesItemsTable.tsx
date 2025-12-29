"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SaleItem } from "@/types/sales";

interface SalesItemsTableProps {
    items: SaleItem[];
}

export function SalesItemsTable({ items }: SalesItemsTableProps) {
    if (!items || items.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No items found for this sale.</div>;
    }

    return (
        <div className="rounded-md border bg-muted/30 m-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div>{item.products?.name}</div>
                                <div className="text-xs text-muted-foreground">{item.products?.barcode}</div>
                            </TableCell>
                            <TableCell>{item.warehouses?.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${Number(item.unit_price).toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
