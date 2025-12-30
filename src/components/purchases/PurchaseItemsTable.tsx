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
import { Trash2, Loader2, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { deletePurchaseOrderItemAction, updatePurchaseOrderItemAction } from "@/app/(dashboard)/purchases/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PurchaseOrderItem } from "@/types/purchases";
import { formatEGP } from "@/lib/utils";

interface PurchaseItemsTableProps {
    items: PurchaseOrderItem[];
}

export function PurchaseItemsTable({ items }: PurchaseItemsTableProps) {
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Edit State
    const [editingItem, setEditingItem] = useState<PurchaseOrderItem | null>(null);
    const [editQty, setEditQty] = useState(0);
    const [editPrice, setEditPrice] = useState(0);
    const [isSaving, startSaveTransition] = useTransition();

    const handleEditClick = (item: PurchaseOrderItem) => {
        setEditingItem(item);
        setEditQty(item.quantity);
        setEditPrice(item.unit_price);
    };

    const handleSaveEdit = () => {
        if (!editingItem) return;

        startSaveTransition(async () => {
            const result = await updatePurchaseOrderItemAction(editingItem.id, editQty, editPrice);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Item updated successfully");
                setEditingItem(null);
            }
        });
    };

    const handleDelete = (itemId: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            setDeletingId(itemId);
            startTransition(async () => {
                const result = await deletePurchaseOrderItemAction(itemId);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success("Item deleted successfully");
                }
                setDeletingId(null);
            });
        }
    };

    if (!items || items.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">No items found for this order.</div>;
    }

    return (
        <div className="rounded-md border bg-muted/30 m-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div>{item.products?.name}</div>
                                <div className="text-xs text-muted-foreground">{item.products?.barcode}</div>
                            </TableCell>
                            <TableCell>{item.warehouses?.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatEGP(item.unit_price)}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{formatEGP(item.total_price)}</Badge>
                            </TableCell>
                            <TableCell className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditClick(item)}
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isPending && deletingId === item.id}
                                    onClick={() => handleDelete(item.id)}
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                >
                                    {isPending && deletingId === item.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Item</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="qty" className="text-right">
                                Quantity
                            </Label>
                            <Input
                                id="qty"
                                type="number"
                                value={editQty}
                                onChange={(e) => setEditQty(Number(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Unit Price
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
