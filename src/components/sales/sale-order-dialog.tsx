"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saleSchema, type SaleFormInput } from "@/lib/validations/sale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTransition, useState } from "react";
import { createSaleAction } from "@/app/(dashboard)/sales/actions";
import { SaleOrderDialogProps } from "@/types/sales";
import { formatEGP } from "@/lib/utils";

export function SaleOrderDialog({ products, warehouses }: SaleOrderDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const form = useForm<SaleFormInput>({
        resolver: zodResolver(saleSchema),
        defaultValues: {
            customer_name: "",
            notes: "",
            items: [{ product_id: "", warehouse_id: "", quantity: 1, unit_price: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    async function onSubmit(values: SaleFormInput) {
        startTransition(async () => {
            const result = await createSaleAction(values);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Sale completed successfully!");
                form.reset();
                setOpen(false);
            }
        });
    }

    const watchItems = form.watch("items");
    const totalAmount = watchItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
    }, 0);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                    <ShoppingBag className="h-4 w-4" /> New Sale
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Process New Sale</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="customer_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Sale Items</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ product_id: "", warehouse_id: "", quantity: 1, unit_price: 0 })}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Item
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Item {index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.product_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product</FormLabel>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            const product = products.find(p => p.id === value);
                                                            if (product) {
                                                                form.setValue(`items.${index}.unit_price`, product.selling_price);
                                                            }
                                                        }}
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select product" />
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
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.warehouse_id`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Warehouse Source</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select warehouse" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {warehouses.map((warehouse) => (
                                                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                                                    {warehouse.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
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
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unit_price`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Selling Price</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="text-sm font-medium text-right">
                                        Subtotal: {formatEGP((watchItems[index]?.quantity || 0) * (watchItems[index]?.unit_price || 0))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Specific details or customer requests..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="flex items-center justify-between pt-4 border-t sticky bottom-0 bg-background pb-2 mt-4">
                            <div className="text-xl font-bold">
                                Total: {formatEGP(totalAmount)}
                            </div>
                            <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Complete Sale"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
