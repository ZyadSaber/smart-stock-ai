'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductDialog } from '@/components/inventory/product-dialog';
import { DeleteProductDialog } from '@/components/inventory/delete-product-dialog';

interface Product {
    id: string;
    name: string;
    category: string;
    barcode: string;
    price: number;
    stock: number;
    cost_price: number;
    selling_price: number;
    category_id: string;
}

interface Category {
    id: string;
    name: string;
}

interface InventoryTableProps {
    products: Product[];
    categories: Category[];
}

export function InventoryTable({ products, categories }: InventoryTableProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter products based on search query (name or barcode)
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) {
            return products;
        }

        const query = searchQuery.toLowerCase().trim();
        return products.filter((product) => {
            const nameMatch = product.name.toLowerCase().includes(query);
            const barcodeMatch = product.barcode.toLowerCase().includes(query);
            return nameMatch || barcodeMatch;
        });
    }, [products, searchQuery]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or barcode..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    {searchQuery ? 'No products found matching your search.' : 'No products available.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((item) => (
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
                                        <div className="flex items-center justify-end gap-1">
                                            <ProductDialog
                                                product={{
                                                    id: item.id,
                                                    name: item.name,
                                                    barcode: item.barcode,
                                                    cost_price: item.cost_price,
                                                    selling_price: item.selling_price,
                                                    category_id: item.category_id
                                                }}
                                                categories={categories}
                                            />
                                            <DeleteProductDialog
                                                productId={item.id}
                                                productName={item.name}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
