"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Branches } from "@/types/user";
import { AddBranchDialog } from "./AddBranches";
import { DeleteBranchDialog } from "./DeleteBranchDialog";

interface BranchesTableProps {
    branches: Branches[];
}

export function BranchTable({ branches }: BranchesTableProps) {
    if (!branches || branches.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No branches found for this sale.</div>;
    }

    return (
        <div className="rounded-md border bg-muted/30 m-4 overflow-hidden">
            <div className="px-4 py-2 bg-muted/50 border-b flex branches-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sale Details</span>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">ID</TableHead>
                        <TableHead className="w-[600px]">Branch Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {branches.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item?.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <DeleteBranchDialog branch={item} />
                                    <AddBranchDialog branch={item} organizationId={item.organization_id} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
