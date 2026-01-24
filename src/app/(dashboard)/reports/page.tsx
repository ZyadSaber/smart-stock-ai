import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SalesReport from "@/components/reports/SalesReport"
import PurchaseReport from "@/components/reports/PurchaseReport"
import StockReport from "@/components/reports/StockReport"
import { getReportsPageMetadata } from "@/services/reports"
import { resolvePageData } from "@/lib/page-utils"

interface ReportsPageProps {
    searchParams: Promise<{ organization_id?: string; branch_id?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
    const metadata = await resolvePageData(searchParams, getReportsPageMetadata);
    if (!metadata) return null;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground">Manage reports and View numbers.</p>
                </div>
            </div>
            <Tabs defaultValue="sales" className="w-full">
                <TabsList className="w-full p-1.5 h-12">
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="purchases">Purchases</TabsTrigger>
                    <TabsTrigger value="stock">Stock</TabsTrigger>
                </TabsList>
                <TabsContent value="sales">
                    <SalesReport
                        customers={metadata.customers}
                    />
                </TabsContent>
                <TabsContent value="purchases">
                    <PurchaseReport suppliers={metadata.suppliers} />
                </TabsContent>
                <TabsContent value="stock">
                    <StockReport products={metadata.products} warehouses={metadata.warehouses} />
                </TabsContent>
            </Tabs>
        </div>
    )
}



