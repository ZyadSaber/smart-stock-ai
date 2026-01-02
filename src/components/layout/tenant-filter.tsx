"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLoading } from "@/lib/loading-context";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


interface Organization {
    id: string;
    name: string;
    branches: {
        id: string;
        name: string;
    }[];
}

interface TenantFilterProps {
    organizations: Organization[];
    currentOrgId?: string;
    currentBranchId?: string;
}

export function TenantFilter({
    organizations,
    currentOrgId: initialOrgId,
    currentBranchId: initialBranchId,
}: TenantFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { startTransition } = useLoading();

    // Use search params as source of truth if props aren't provided
    const urlOrgId = searchParams.get("organization_id");
    const urlBranchId = searchParams.get("branch_id");

    const activeOrgId = initialOrgId || urlOrgId || "all";
    const activeBranchId = initialBranchId || urlBranchId || "all";

    const handleOrgChange = (orgId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (orgId === "all") {
            params.delete("organization_id");
            params.delete("branch_id");
        } else {
            params.set("organization_id", orgId);
            params.delete("branch_id");
        }
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const handleBranchChange = (branchId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (branchId === "all") {
            params.delete("branch_id");
        } else {
            params.set("branch_id", branchId);
        }
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };


    const selectedOrg = organizations.find((o) => o.id === activeOrgId);

    const branches = selectedOrg?.branches || [];

    if (organizations.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">


                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Org</span>
                <Select value={activeOrgId} onValueChange={handleOrgChange}>
                    <SelectTrigger className="h-7 w-auto min-w-[200px] border-none bg-transparent p-0 pl-2 text-sm font-medium focus:ring-0 shadow-none">
                        <SelectValue placeholder="Organization" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Organizations</SelectItem>
                        {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                                {org.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full border border-border/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Branch</span>
                <Select
                    value={activeBranchId}
                    onValueChange={handleBranchChange}
                    disabled={activeOrgId === "all" || branches.length === 0}
                >
                    <SelectTrigger className="h-7 w-auto min-w-[200px] border-none bg-transparent p-0 pl-2 text-sm font-medium focus:ring-0 shadow-none">
                        <SelectValue placeholder="Branch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}




