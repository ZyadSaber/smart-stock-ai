import { getSalesPageData } from "@/services/sales";
import { resolvePageData } from "@/lib/page-utils";
import { SalesView } from "@/components/sales/SalesView";

interface SalesPageProps {
    searchParams: Promise<{
        organization_id?: string;
        branch_id?: string;
        date_from?: string;
        date_to?: string;
        customer_id?: string;
        notes?: string;
    }>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
    const result = await resolvePageData(searchParams, getSalesPageData);

    if (result.error || !result.data) {
        return <div className="p-8 text-red-500">Error: {result.error || "Failed to load data"}</div>
    }

    const { sales, products, warehouses, customers } = result.data;

    return (
        <div className="p-8">
            <SalesView
                initialSales={sales}
                products={products}
                warehouses={warehouses}
                customers={customers}
            />
        </div>
    );
}
