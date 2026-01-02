import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockDialog } from "@/components/warehouses/stock-dialog";
import { ProductWithStock } from "@/services/warehouses";

interface StockMatrixProps {
    products: ProductWithStock[];
    warehouses: { id: string; name: string }[];
    stockMap: Map<string, number>;
}

export function StockMatrix({ products, warehouses, stockMap }: StockMatrixProps) {
    return (
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
                                {warehouses.map((warehouse) => (
                                    <TableHead key={warehouse.id} className="text-center">
                                        {warehouse.name}
                                    </TableHead>
                                ))}
                                <TableHead className="text-center font-semibold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={warehouses.length + 3}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        No products available. Add products in the Inventory page.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => {
                                    const totalStock = warehouses.reduce((sum, warehouse) => {
                                        const key = `${product.id}-${warehouse.id}`;
                                        return sum + (stockMap.get(key) || 0);
                                    }, 0);

                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium sticky left-0 bg-background">
                                                {product.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {product.barcode}
                                            </TableCell>
                                            {warehouses.map((warehouse) => {
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
    );
}
