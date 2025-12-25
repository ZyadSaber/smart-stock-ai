"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryFormInput } from "@/lib/validations/category";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTransition, useState, useEffect } from "react";
import { createCategoryAction, updateCategoryAction } from "@/app/(dashboard)/inventory/category-actions";

interface Category {
    id: string;
    name: string;
}

interface CategoryDialogProps {
    category?: Category;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CategoryDialog({
    category,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: CategoryDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [internalOpen, setInternalOpen] = useState(false);

    // Use controlled or internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOnOpenChange || setInternalOpen;

    const isEditMode = !!category;

    const form = useForm<CategoryFormInput>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category?.name || "",
        },
    });

    // Reset form when category changes (for edit mode)
    useEffect(() => {
        if (category) {
            form.reset({
                name: category.name,
            });
        }
    }, [category, form]);

    // Reset form when dialog opens in add mode
    useEffect(() => {
        if (!isEditMode && open) {
            form.reset({
                name: "",
            });
        }
    }, [open, isEditMode, form]);

    async function onSubmit(values: CategoryFormInput) {
        startTransition(async () => {
            const result = isEditMode && category
                ? await updateCategoryAction(category.id, values)
                : await createCategoryAction(values);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(isEditMode ? "Category updated successfully!" : "Category added successfully!");
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
        <Button variant="outline" size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" /> Add Category
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Category" : "Add New Category"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Electronics, Clothing, Food" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? "Updating..." : "Saving..."}
                                </>
                            ) : (
                                isEditMode ? "Update Category" : "Save Category"
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
