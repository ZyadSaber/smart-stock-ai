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
import { GenerateInvoiceButton } from "./GenerateInvoiceButton";
import { SaleItem } from "@/types/sales";
import { formatEGP } from "@/lib/utils";

interface SalesItemsTableProps {
    items: SaleItem[];
    saleId: string;
}

export function SalesItemsTable({ items, saleId }: SalesItemsTableProps) {
    if (!items || items.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No items found for this sale.</div>;
    }

    return (
        <div className="rounded-md border bg-muted/30 m-4 overflow-hidden">
            <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sale Details</span>
                <GenerateInvoiceButton saleId={saleId} variant="secondary" />
            </div>
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
                            <TableCell>{formatEGP(Number(item.unit_price))}</TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {formatEGP(Number(item.quantity) * Number(item.unit_price))}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
