"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { warehouseSchema, type WarehouseFormInput } from "@/lib/validations/warehouse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { createWarehouseAction, updateWarehouseAction } from "@/app/(dashboard)/warehouses/actions";

interface Warehouse {
    id: string;
    name: string;
    location?: string | null;
    branch_id?: string | null;
}

interface WarehouseDialogProps {
    warehouse?: Warehouse;
    trigger?: React.ReactNode;
}

export function WarehouseDialog({ warehouse, trigger }: WarehouseDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const isEditMode = !!warehouse;

    const form = useForm<WarehouseFormInput>({
        resolver: zodResolver(warehouseSchema),
        defaultValues: {
            name: warehouse?.name || "",
            location: warehouse?.location || "",
            is_shared: warehouse?.branch_id === null || false,
        },
    });

    // Reset form when warehouse changes (for edit mode)
    useEffect(() => {
        if (warehouse) {
            form.reset({
                name: warehouse.name,
                location: warehouse.location || "",
                is_shared: warehouse.branch_id === null,
            });
        }
    }, [warehouse, form]);

    // Reset form when dialog opens in add mode
    useEffect(() => {
        if (!isEditMode && open) {
            form.reset({
                name: "",
                location: "",
                is_shared: false,
            });
        }
    }, [open, isEditMode, form]);

    async function onSubmit(values: WarehouseFormInput) {
        startTransition(async () => {
            const result = isEditMode && warehouse
                ? await updateWarehouseAction(warehouse.id, values)
                : await createWarehouseAction(values);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditMode ? "Warehouse updated successfully!" : "Warehouse added successfully!");
                form.reset();
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
            <PlusCircle className="h-4 w-4" /> Add Warehouse
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Warehouse Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Main Warehouse, Downtown Store" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: 123 Main St, Cairo" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField
                            control={form.control}
                            name="is_shared"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Shared Warehouse</FormLabel>
                                        <FormDescription>
                                            Accessible from all branches in your organization
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                isEditMode ? "Update Warehouse" : "Save Warehouse"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
