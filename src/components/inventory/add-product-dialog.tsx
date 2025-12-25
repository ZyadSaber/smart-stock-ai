"use client"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "@/lib/validations/product";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner"; // لو بتستخدم sonner للـ notifications
import { useTransition } from "react";
import { createProductAction } from "@/app/(dashboard)/inventory/actions";

export function AddProductDialog({ categories }: { categories: any[] }) {
    const [isPending, startTransition] = useTransition();
    const form = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: { name: "", barcode: "", cost_price: 0, selling_price: 0, category_id: "" },
    });

    async function onSubmit(values: any) {
        startTransition(async () => {
            const result = await createProductAction(values);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Product created!");
                form.reset();
                toast.success("Product added successfully!");
            }
        });
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="cost_price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cost Price</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="selling_price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Selling Price</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Product"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}