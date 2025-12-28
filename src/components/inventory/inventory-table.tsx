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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProductDialog } from '@/components/inventory/product-dialog';
import { DeleteProductDialog } from '@/components/inventory/delete-product-dialog';
import { InventoryTableProps } from "@/types/inventory";

export function InventoryTable({ products, categories }: InventoryTableProps) {
    const [{ searchQuery, category }, setSearchQuery] = useState({
        searchQuery: '',
        category: ''
    });

    const filteredProducts = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const categoryFilter = category.toLowerCase().trim();

        return products.filter((product) => {
            const nameMatch = product.name.toLowerCase().includes(query);
            const barcodeMatch = product.barcode.toLowerCase().includes(query);
            const searchMatch = !query || nameMatch || barcodeMatch;

            const categoryMatch = !categoryFilter || categoryFilter === "all" || product.category.toLowerCase() === categoryFilter;

            return searchMatch && categoryMatch;
        });
    }, [category, products, searchQuery]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-1/2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or barcode..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(prev => ({ ...prev, searchQuery: e.target.value }))}
                    />
                </div>
                <Select onValueChange={(value) => setSearchQuery(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className='w-1/5'>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                                                product={item}
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
