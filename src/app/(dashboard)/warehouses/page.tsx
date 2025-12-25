import { createClient } from "@/utils/supabase/server";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WarehouseDialog } from "@/components/warehouses/warehouse-dialog";
import { DeleteWarehouseDialog } from "@/components/warehouses/delete-warehouse-dialog";
import { StockDialog } from "@/components/warehouses/stock-dialog";
import { Badge } from "@/components/ui/badge";

export default async function WarehousesPage() {
    const supabase = await createClient();

    // Fetch warehouses
    const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name, location')
        .order('name');

    // Fetch all products
    const { data: products } = await supabase
        .from('products')
        .select('id, name, barcode')
        .order('name');

    // Fetch all stock data
    const { data: stocks } = await supabase
        .from('product_stocks')
        .select('product_id, warehouse_id, quantity');

    // Create a map for quick stock lookup
    const stockMap = new Map<string, number>();
    stocks?.forEach(stock => {
        const key = `${stock.product_id}-${stock.warehouse_id}`;
        stockMap.set(key, stock.quantity);
    });

    // Calculate totals for each warehouse
    const warehouseTotals = warehouses?.map(warehouse => {
        const totalItems = stocks?.filter(s => s.warehouse_id === warehouse.id).length || 0;
        const totalQuantity = stocks
            ?.filter(s => s.warehouse_id === warehouse.id)
            .reduce((sum, s) => sum + s.quantity, 0) || 0;
        return { ...warehouse, totalItems, totalQuantity };
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
                    <p className="text-muted-foreground">Manage your warehouses and stock levels.</p>
                </div>
                <WarehouseDialog />
            </div>

            {/* Warehouse Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {warehouseTotals?.map((warehouse) => (
                    <Card key={warehouse.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold">{warehouse.name}</CardTitle>
                            <div className="flex gap-1">
                                <WarehouseDialog warehouse={warehouse} />
                                <DeleteWarehouseDialog
                                    warehouseId={warehouse.id}
                                    warehouseName={warehouse.name}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="mb-3">
                                {warehouse.location || "No location specified"}
                            </CardDescription>
                            <div className="flex gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Products</p>
                                    <p className="text-2xl font-bold">{warehouse.totalItems}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Units</p>
                                    <p className="text-2xl font-bold">{warehouse.totalQuantity}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Stock Matrix */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock Matrix</CardTitle>
                    <CardDescription>
                        View and manage product quantities across all warehouses. Click on a quantity to update it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px] sticky left-0 bg-background">Product</TableHead>
                                    <TableHead className="w-[150px]">Barcode</TableHead>
                                    {warehouses?.map((warehouse) => (
                                        <TableHead key={warehouse.id} className="text-center">
                                            {warehouse.name}
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center font-semibold">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products && products.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={(warehouses?.length || 0) + 3}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No products available. Add products in the Inventory page.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products?.map((product) => {
                                        const totalStock = warehouses?.reduce((sum, warehouse) => {
                                            const key = `${product.id}-${warehouse.id}`;
                                            return sum + (stockMap.get(key) || 0);
                                        }, 0) || 0;

                                        return (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-medium sticky left-0 bg-background">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {product.barcode}
                                                </TableCell>
                                                {warehouses?.map((warehouse) => {
                                                    const key = `${product.id}-${warehouse.id}`;
                                                    const quantity = stockMap.get(key) || 0;

                                                    return (
                                                        <TableCell key={warehouse.id} className="text-center">
                                                            <StockDialog
                                                                productId={product.id}
                                                                productName={product.name}
                                                                warehouseId={warehouse.id}
                                                                warehouseName={warehouse.name}
                                                                currentQuantity={quantity}
                                                            />
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="text-center">
                                                    <Badge variant={totalStock < 10 ? "destructive" : "secondary"}>
                                                        {totalStock}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
