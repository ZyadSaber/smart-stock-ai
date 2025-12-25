'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";
import { updateStockAction } from "@/app/(dashboard)/warehouses/actions";
import { toast } from "sonner";

interface StockDialogProps {
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    currentQuantity: number;
}

export function StockDialog({
    productId,
    productName,
    warehouseId,
    warehouseName,
    currentQuantity
}: StockDialogProps) {
    const [open, setOpen] = useState(false);
    const [quantity, setQuantity] = useState(currentQuantity.toString());
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        const numQuantity = parseInt(quantity);

        if (isNaN(numQuantity) || numQuantity < 0) {
            toast.error("Please enter a valid quantity (0 or greater).");
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updateStockAction(productId, warehouseId, numQuantity);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Stock updated successfully.");
                setOpen(false);
            }
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <Package className="h-3 w-3" />
                    {currentQuantity}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Stock</DialogTitle>
                    <DialogDescription>
                        Update the quantity of <span className="font-semibold">{productName}</span> in{" "}
                        <span className="font-semibold">{warehouseName}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Enter quantity"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Updating..." : "Update Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
