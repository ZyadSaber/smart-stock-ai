"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "@/lib/validations/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { createProductAction, updateProductAction, type ProductFormInput } from "@/app/(dashboard)/inventory/actions";

import { ProductDialogProps } from "@/types/inventory";

export function ProductDialog({
    categories,
    product,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: ProductDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [internalOpen, setInternalOpen] = useState(false);

    // Use controlled or internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;

    const isEditMode = !!product;

    const form = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: product?.name || "",
            barcode: product?.barcode || "",
            cost_price: product?.cost_price || 0,
            selling_price: product?.selling_price || 0,
            category_id: product?.category_id || ""
        },
    });

    // Reset form when product changes (for edit mode)
    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                barcode: product.barcode,
                cost_price: product.cost_price,
                selling_price: product.selling_price,
                category_id: product.category_id
            });
        }
    }, [product, form]);

    // Reset form when dialog opens in add mode
    useEffect(() => {
        if (!isEditMode && open) {
            form.reset({
                name: "",
                barcode: "",
                cost_price: 0,
                selling_price: 0,
                category_id: ""
            });
        }
    }, [open, isEditMode, form]);

    async function onSubmit(values: ProductFormInput) {
        startTransition(async () => {
            const result = isEditMode && product
                ? await updateProductAction(product.id, values)
                : await createProductAction(values);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditMode ? "Product updated successfully!" : "Product added successfully!");
                form.reset();
                setOpen(false);
            }
        });
    }

    const defaultTrigger = isEditMode ? (
        <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
        </Button>
    ) : (
        <Button className="gap-2">
            <PlusCircle className="h-4 w-4" /> Add Product
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Product Name</FormLabel>
                                <FormControl><Input placeholder="Ex: MacBook Pro M3" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="barcode" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Barcode</FormLabel>
                                <FormControl><Input placeholder="Enter barcode" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="category_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="cost_price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cost Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={typeof field.value === "number" && field.value === 0 ? "" : String(field.value ?? "")}
                                            onChange={(e) => {
                                                const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                field.onChange(isNaN(value) ? 0 : value);
                                            }}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="selling_price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selling Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={typeof field.value === "number" && field.value === 0 ? "" : String(field.value ?? "")}
                                            onChange={(e) => {
                                                const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                                field.onChange(isNaN(value) ? 0 : value);
                                            }}
                                            onBlur={field.onBlur}
                                            name={field.name}
                                            ref={field.ref}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                isEditMode ? "Update Product" : "Save Product"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

