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
import { Fragment, useState, useTransition } from "react";
import { deleteSaleAction, getSaleItems } from "@/app/(dashboard)/sales/actions";
import { toast } from "sonner";
import { SalesItemsTable } from "./SalesItemsTable";
import { cn, formatEGP } from "@/lib/utils";
import { Sale, SaleItem } from "@/types/sales";

import { GenerateInvoiceButton } from "./GenerateInvoiceButton";

interface SalesHistoryTableProps {
    initialSales: Sale[];
}

export function SalesHistoryTable({ initialSales }: SalesHistoryTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
    const [saleItems, setSaleItems] = useState<Record<string, SaleItem[]>>({});

    const [isDeleting, startDeleteTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const toggleRow = async (saleId: string) => {
        setExpandedRows(prev => ({ ...prev, [saleId]: !prev[saleId] }));

        if (!expandedRows[saleId] && !saleItems[saleId]) {
            setLoadingItems(prev => ({ ...prev, [saleId]: true }));
            try {
                const items = await getSaleItems(saleId);
                setSaleItems(prev => ({ ...prev, [saleId]: items }));
            } catch {
                toast.error("Failed to load details");
            } finally {
                setLoadingItems(prev => ({ ...prev, [saleId]: false }));
            }
        }
    };

    const handleDelete = (saleId: string) => {
        if (confirm("Are you sure you want to delete this sale? This will NOT restore stock levels.")) {
            setDeletingId(saleId);
            startDeleteTransition(async () => {
                const result = await deleteSaleAction(saleId);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Sale deleted");
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
                        <TableHead>Customer</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Seller Name</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialSales.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                No sales recorded yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        initialSales.map((sale) => (
                            <Fragment key={sale.id}>
                                <TableRow className={cn(expandedRows[sale.id] && "bg-muted/50")}>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRow(sale.id)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {expandedRows[sale.id] ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {new Date(sale.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {sale.customer_name || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {formatEGP(Number(sale.total_amount))}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-green-600 font-medium whitespace-nowrap">
                                        {formatEGP(Number(sale.profit_amount))}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {sale.profiles?.full_name || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <GenerateInvoiceButton saleId={sale.id} showIconOnly />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                disabled={isDeleting && deletingId === sale.id}
                                                onClick={() => handleDelete(sale.id)}
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            >
                                                {isDeleting && deletingId === sale.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedRows[sale.id] && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="p-0 border-b">
                                            {loadingItems[sale.id] ? (
                                                <div className="flex items-center justify-center p-8">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : (
                                                <SalesItemsTable items={saleItems[sale.id]} saleId={sale.id} />
                                            )}
                                            {sale.notes && (
                                                <div className="px-14 py-3 text-sm text-muted-foreground italic border-t bg-muted/10">
                                                    Note: {sale.notes}
                                                </div>
                                            )}
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
