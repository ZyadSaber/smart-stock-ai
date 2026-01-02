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
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useState } from "react";
import { BranchTable } from "./BranchTable";
import { cn } from "@/lib/utils";
import { Organizations } from "@/types/user";
import { AddOrganizationDialog } from "./AddOrganizationDialog";
import { DeleteOrganizationDialog } from "./DeleteOrganization";
import { AddBranchDialog } from "./AddBranches";

interface OrganizationTableProps {
    organizations: Organizations[];
}

export function OrganizationTable({ organizations }: OrganizationTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

    const toggleRow = async (saleId: string) => {
        setExpandedRows(prev => ({ ...prev, [saleId]: !prev[saleId] }));
    };
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead className="w-[300px]">ID</TableHead>
                        <TableHead>Organization Name</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Updated At</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {organizations.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                No sales recorded yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        organizations.map((sale) => (
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
                                        {sale.id}
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {sale.name || '-'}
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {sale.active.toString() || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(sale.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(sale.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <DeleteOrganizationDialog organization={sale} />
                                            <AddOrganizationDialog organization={sale} />
                                            <AddBranchDialog organizationId={sale.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                                {expandedRows[sale.id] && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="p-0 border-b">
                                            <BranchTable branches={sale.branches} />
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
