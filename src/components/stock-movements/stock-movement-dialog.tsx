"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockMovementSchema, type StockMovementFormInput } from "@/lib/validations/stock-movement";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { createStockMovementAction, updateStockMovementAction } from "@/app/(dashboard)/stock-movements/actions";

interface Product {
    id: string;
    name: string;
}

interface Warehouse {
    id: string;
    name: string;
}

interface StockMovement {
    id: string;
    product_id: string;
    from_warehouse_id: string | null;
    to_warehouse_id: string | null;
    quantity: number;
    notes?: string | null;
}

interface StockMovementDialogProps {
    products: Product[];
    warehouses: Warehouse[];
    movement?: StockMovement;
}

export function StockMovementDialog({ products, warehouses, movement }: StockMovementDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const isEditMode = !!movement;

    const form = useForm<StockMovementFormInput>({
        resolver: zodResolver(stockMovementSchema),
        defaultValues: {
            product_id: movement?.product_id || "",
            from_warehouse_id: movement?.from_warehouse_id || "none",
            to_warehouse_id: movement?.to_warehouse_id || "none",
            quantity: movement?.quantity || 1,
            notes: movement?.notes || "",
        },
    });

    useEffect(() => {
        if (movement && open) {
            form.reset({
                product_id: movement.product_id,
                from_warehouse_id: movement.from_warehouse_id || "none",
                to_warehouse_id: movement.to_warehouse_id || "none",
                quantity: movement.quantity,
                notes: movement.notes || "",
            });
        }
    }, [movement, open, form]);

    async function onSubmit(values: StockMovementFormInput) {
        startTransition(async () => {
            const payload = {
                ...values,
                from_warehouse_id: (values.from_warehouse_id === "none" || !values.from_warehouse_id) ? "none" : values.from_warehouse_id,
                to_warehouse_id: (values.to_warehouse_id === "none" || !values.to_warehouse_id) ? "none" : values.to_warehouse_id,
            };

            const result = isEditMode && movement
                ? await updateStockMovementAction(movement.id, payload)
                : await createStockMovementAction(payload);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditMode ? "Movement updated successfully!" : "Stock movement recorded successfully!");
                if (!isEditMode) form.reset();
                setOpen(false);
            }
        });
    }

    const defaultTrigger = isEditMode ? (
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Pencil className="h-4 w-4" />
        </Button>
    ) : (
        <Button className="gap-2">
            <ArrowRightLeft className="h-4 w-4" /> Transfer Stock
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Movement" : "Transfer Stock"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="product_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isEditMode}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isEditMode && <p className="text-xs text-muted-foreground">Product cannot be changed once recorded.</p>}
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="from_warehouse_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>From Warehouse</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Source" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None (New Stock)</SelectItem>
                                            {warehouses.map((warehouse) => (
                                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="to_warehouse_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>To Warehouse</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Destination" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None (Removed)</SelectItem>
                                            {warehouses.map((warehouse) => (
                                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                                    {warehouse.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="quantity" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantity</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Add any notes about this transfer..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? "Updating..." : "Recording..."}
                                </>
                            ) : (
                                isEditMode ? "Update Movement" : "Record Transfer"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
