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
import { ChevronDown, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deletePurchaseOrderAction, getPurchaseOrderItems } from "@/app/(dashboard)/purchases/actions";
import { toast } from "sonner";
import { PurchaseItemsTable } from "./PurchaseItemsTable";

import { cn } from "@/lib/utils";

interface PurchaseHistoryTableProps {
    initialPurchaseOrders: any[];
}

export function PurchaseHistoryTable({ initialPurchaseOrders }: PurchaseHistoryTableProps) {
    const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
    const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});

    const [isDeleting, startDeleteTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const toggleRow = async (orderId: string) => {
        // Toggle state
        setExpandedRows(prev => ({ ...prev, [orderId]: !prev[orderId] }));

        // If opening and no items loaded yet
        if (!expandedRows[orderId] && !orderItems[orderId]) {
            setLoadingItems(prev => ({ ...prev, [orderId]: true }));
            try {
                const items = await getPurchaseOrderItems(orderId);
                setOrderItems(prev => ({ ...prev, [orderId]: items }));
            } catch {
                toast.error("Failed to load details");
            } finally {
                setLoadingItems(prev => ({ ...prev, [orderId]: false }));
            }
        }
    };

    const handleDeleteInvoice = (orderId: string) => {
        if (confirm("Are you sure you want to delete this entire invoice? This action cannot be undone.")) {
            setDeletingId(orderId);
            startDeleteTransition(async () => {
                const result = await deletePurchaseOrderAction(orderId);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Purchase order deleted");
                    setPurchaseOrders(prev => prev.filter(po => po.id !== orderId));
                }
                setDeletingId(null);
            });
        }
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
                    {purchaseOrders.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                No purchase orders recorded yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        purchaseOrders.map((order) => (
                            <>
                                <TableRow key={order.id} className={cn(expandedRows[order.id] && "bg-muted/50")}>
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
                                            ${parseFloat(order.total_amount).toFixed(2)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                        <span title={order.notes}>{order.notes || '-'}</span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {order.created_by_user?.full_name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={isDeleting && deletingId === order.id}
                                            onClick={() => handleDeleteInvoice(order.id)}
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        >
                                            {isDeleting && deletingId === order.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {expandedRows[order.id] && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-0 border-b">
                                            {loadingItems[order.id] ? (
                                                <div className="flex items-center justify-center p-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : (
                                                <PurchaseItemsTable items={orderItems[order.id]} />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
