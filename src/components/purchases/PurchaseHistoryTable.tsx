"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import { cn, formatEGP } from "@/lib/utils";
import { PurchaseOrder } from "@/types/purchases";
import DeleteDialog from "@/components/shared/delete-dialog";
import { AddItemDialog } from "./AddItemDialog"
import { deletePurchaseOrderAction } from "@/app/(dashboard)/purchases/actions"
import { PurchaseItemsTable } from "./PurchaseItemsTable";
import { PurchaseProduct, Warehouse } from "@/types/purchases";

interface PurchaseHistoryTableProps {
    initialPurchaseOrders: PurchaseOrder[];
    products: PurchaseProduct[];
    warehouses: Warehouse[];
}

export function PurchaseHistoryTable({ initialPurchaseOrders, products, warehouses }: PurchaseHistoryTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const toggleRow = async (orderId: string) => {
        setExpandedRows(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialPurchaseOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                No purchase orders recorded yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        initialPurchaseOrders.map((order) => (
                            <Fragment key={order.id}>
                                <TableRow className={cn(expandedRows[order.id] && "bg-muted/50")}>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRow(order.id)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {expandedRows[order.id] ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {new Date(order.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {order.supplier_name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {formatEGP(parseFloat(order.total_amount))}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                        <span title={order.notes || '-'}>{order.notes || '-'}</span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {order.created_by_user || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <AddItemDialog id={order.id} products={products} warehouses={warehouses} />
                                        <DeleteDialog id={order.id} deleteAction={deletePurchaseOrderAction} />
                                    </TableCell>
                                </TableRow>
                                {expandedRows[order.id] && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0 border-b">
                                            {<PurchaseItemsTable items={order?.items_data || []} />}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </Fragment>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
