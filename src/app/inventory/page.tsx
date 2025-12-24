import { getInventoryData } from '@/services/inventory';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddProductDialog } from '@/components/inventory/add-product-dialog';

export default async function InventoryPage() {
    const products = await getInventoryData();
    const supabase = await createClient();
    const { data: categories } = await supabase.from('categories').select('id, name');

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">Manage your products and stock levels.</p>
                </div>
                {/* <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Product
                </Button> */}
                <AddProductDialog categories={categories || []} />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or barcode..." className="pl-10" />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Barcode</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock Level</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="font-mono text-xs">{item.barcode}</TableCell>
                                <TableCell>${item.price.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge variant={item.stock < 10 ? "destructive" : "secondary"}>
                                        {item.stock} units
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}