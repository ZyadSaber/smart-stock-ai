"use client";

import { useTransition, memo, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createSupplierAction } from "@/app/(dashboard)/suppliers/actions";
import { supplierSchema } from "@/lib/validations/supplier";
import { useRouter } from "next/navigation";
import { useVisibility, useFormManager } from "@/hooks";

interface AddSupplierDialogProps {
    onSuccess: (newId: string, name: string) => void;
}

const AddSupplierDialog = ({ onSuccess }: AddSupplierDialogProps) => {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const { visible, handleClose, handleStateChange } = useVisibility()
    const { formData, handleChange, resetForm, errors, validate } = useFormManager({
        schema: supplierSchema,
        initialData: {
            name: "",
            phone: "",
            location: "",
        }
    })

    const handleSave = useCallback(async () => {
        if (!validate()) return
        startTransition(async () => {
            const result = await createSupplierAction(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Supplier added successfully");
                handleClose()
                resetForm()
                router.refresh(); // Refresh to update the list in the parent
                if (result.data) {
                    onSuccess(result.data.id, formData.name);
                }
            }
        });
    }, [formData, validate, startTransition, handleClose, resetForm, router, onSuccess]);

    return (
        <Dialog open={visible} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 border-dashed h-8"
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Plus className="h-4 w-4" />
                    Add New Supplier
                </Button>
            </DialogTrigger>
            <DialogContent
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                </DialogHeader>
                <Input
                    label="Supplier Name"
                    name="name"
                    placeholder="Ex: ABC Suppliers Ltd."
                    error={errors.name}
                    required
                    value={formData.name}
                    onChange={handleChange}
                />
                <Input
                    label="Phone Number"
                    name="phone"
                    placeholder="Ex: +20123456789"
                    error={errors.phone}
                    value={formData.phone}
                    onChange={handleChange}
                />
                <Input
                    label="Location"
                    name="location"
                    placeholder="Ex: Cairo, Egypt"
                    error={errors.location}
                    value={formData.location}
                    onChange={handleChange}
                />
                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? "Adding..." : "Add Supplier"}
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
}

export default memo(AddSupplierDialog)
