'use client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PackagePlus } from "lucide-react";
import { useFormManager, useVisibility } from "@/hooks"
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { PurchaseProduct, Warehouse } from "@/types/purchases";
import { SelectField } from "@/components/ui/select";
import { purchaseOrderItemSchema } from "@/lib/validations/purchase-order"
import { AddItemDialogDefaultValues } from "./constants"
import { updateInvoiceWithNewItem } from "@/app/(dashboard)/purchases/actions"

interface AddItemDialogProps {
    id: string;
    products: PurchaseProduct[];
    warehouses: Warehouse[];
}

export function AddItemDialog({ id, products, warehouses }: AddItemDialogProps) {
    const { visible, handleClose, handleStateChange } = useVisibility()
    const [isDeleting, startAddingItem] = useTransition();
    const {
        formData,
        handleChange,
        resetForm,
        handleFieldChange,
        validate,
        errors,
        handleChangeMultiInputs
    } = useFormManager({
        initialData: {
            ...AddItemDialogDefaultValues,
            purchase_order_id: id
        },
        schema: purchaseOrderItemSchema,
    })

    const handleSelectProduct = (product_id: string) => {
        const product = products.find(p => p.key === product_id);
        handleChangeMultiInputs({
            product_id,
            unit_price: product?.cost_price || 0
        })
    }

    const handleSubmit = () => {
        if (!validate()) return
        startAddingItem(async () => {
            const result = await updateInvoiceWithNewItem(formData);
            if (result?.error) {
                console.error("Failed to create purchase order item:", result.error);
                toast.error(result.error);
            } else {
                toast.success("Purchase order item created successfully.");
                handleClose()
                resetForm()
            }
        });
    };

    return (
        <Dialog open={visible} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" >
                    <PackagePlus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="w-3xl sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add Item</DialogTitle>
                    <DialogDescription>
                        Add a new item to this purchase order.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-4 flex-wrap">
                    <SelectField
                        label="Product"
                        name="product_id"
                        options={products}
                        value={formData?.product_id}
                        containerClassName="w-[48%]"
                        onValueChange={handleSelectProduct}
                        error={errors.product_id}
                    />
                    <SelectField
                        label="Warehouse"
                        name="warehouse_id"
                        options={warehouses}
                        value={formData?.warehouse_id}
                        containerClassName="w-[48%]"
                        onValueChange={(value) => handleFieldChange({ name: "warehouse_id", value })}
                        error={errors.warehouse_id}
                    />
                    <Input
                        id="qty"
                        label="Quantity"
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        containerClassName="w-[48%]"
                        error={errors.quantity}
                    />
                    <Input
                        id="unit_price"
                        label="Unit Price"
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        name="unit_price"
                        onChange={handleChange}
                        containerClassName="w-[48%]"
                        error={errors.unit_price}
                    />
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                    // disabled={isDeleting}
                    >
                        {isDeleting ? "Adding..." : "Add"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}