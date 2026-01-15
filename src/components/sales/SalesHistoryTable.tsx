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
import { deleteSaleAction } from "@/services/sales";
import DeleteDialog from "@/components/shared/delete-dialog";
import { SalesItemsTable } from "./SalesItemsTable";
import { cn, formatEGP } from "@/lib/utils";
import { SalesHistoryTableProps } from "@/types/sales";
import { GenerateInvoiceButton } from "./GenerateInvoiceButton";
import { SaleOrderDialog } from "./sale-order-dialog";

export function SalesHistoryTable({
    initialSales,
    products,
    warehouses,
    customers
}: SalesHistoryTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (saleId: string) => () => {
        setExpandedRows(prev => ({ ...prev, [saleId]: !prev[saleId] }));
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
                                            onClick={toggleRow(sale.id)}
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
                                        {sale.created_by_user || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <GenerateInvoiceButton sale={sale} />
                                            <SaleOrderDialog
                                                products={products}
                                                warehouses={warehouses}
                                                customers={customers}
                                                previousData={sale}
                                            />
                                            <DeleteDialog id={sale.id} deleteAction={deleteSaleAction} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedRows[sale.id] && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="p-0 border-b">
                                            <SalesItemsTable items={sale.items_data} saleId={sale.id} />
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
