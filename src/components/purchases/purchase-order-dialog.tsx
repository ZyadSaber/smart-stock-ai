"use client";

import { useTransition } from "react";
import { ShoppingCart, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { purchaseOrderSchema, type PurchaseOrderItemInput } from "@/lib/validations/purchase-order";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import { createPurchaseOrderAction, updatePurchaseOrderAction } from "@/services/purchases";
import { PurchaseOrderDialogProps } from "@/types/purchases";
import { formatEGP } from "@/lib/utils";
import { useFormManager, useVisibility } from "@/hooks"
import { addPurchaseOrderDefaultValues } from "./constants";
import AddSupplierDialog from "../suppliers/AddSupplierDialog";

export function PurchaseOrderDialog({ products, warehouses, suppliers, previousData }: PurchaseOrderDialogProps) {
    const { visible, handleClose, handleStateChange } = useVisibility()
    const [isPending, startTransition] = useTransition();

    const {
        formData,
        handleChange,
        handleFieldChange,
        resetForm,
        validate,
        errors
    } = useFormManager({
        schema: purchaseOrderSchema,
        initialData: {
            ...addPurchaseOrderDefaultValues,
            ...previousData
        }
    })

    const handleCancel = () => {
        resetForm()
        handleClose()
    }

    async function handleSave() {
        if (!validate()) return
        startTransition(async () => {
            const result = previousData
                ? await updatePurchaseOrderAction(previousData.id, formData)
                : await createPurchaseOrderAction(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(previousData ? "Purchase order updated successfully!" : "Purchase order created successfully!");
                handleCancel()
            }
        });
    }


    const handleAddItem = () => {
        handleFieldChange({
            name: "items_data",
            value: [...formData.items_data, { product_id: "", warehouse_id: "", quantity: 1, unit_price: 0 }]
        })
    }

    const handleRemoveItem = (index: number) => () => {
        handleFieldChange({
            name: "items_data",
            value: formData.items_data.filter((_, i) => i !== index)
        })
    }

    const handleItemsChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        const computedItems = [...formData.items_data] as PurchaseOrderItemInput[]
        //@ts-expect-error ignore this
        computedItems[index][name as keyof PurchaseOrderItemInput] = parseInt(value)
        handleFieldChange({
            name: "items_data",
            value: computedItems
        })
    }

    const handleChangeProduct = (index: number) => (value: string) => {

        const computedItems = [...formData.items_data] as PurchaseOrderItemInput[]
        const product = products.find(p => p.key === value)
        computedItems[index]["product_id"] = value
        computedItems[index]["unit_price"] = product?.cost_price || 0
        handleFieldChange({
            name: "items_data",
            value: computedItems
        })
    }

    const handleChangeWarehouse = (index: number) => (value: string) => {

        const computedItems = [...formData.items_data] as PurchaseOrderItemInput[]
        computedItems[index]["warehouse_id"] = value
        handleFieldChange({
            name: "items_data",
            value: computedItems
        })
    }

    return (
        <Dialog open={visible} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                <Button className="gap-2" variant={previousData ? "ghost" : "default"}>
                    {!!previousData ? "" : "New Purchase Order"}
                    {!!previousData ? <Pencil className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{previousData ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
                </DialogHeader>
                <SelectField
                    label="Supplier Name"
                    name="supplier_id"
                    options={suppliers}
                    value={formData.supplier_id || ""}
                    containerClassName="w-[100%]"
                    placeholder="Ex: ABC Suppliers Ltd."
                    onValueChange={(value) => {
                        handleFieldChange({ name: "supplier_id", value });
                    }}
                    error={errors.supplier_id || errors.supplier_name}
                    showSearch
                    renderAddField={(onSuccess: (id: string) => void) => (
                        <AddSupplierDialog onSuccess={onSuccess} />
                    )}
                />
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Items</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddItem}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                    </div>
                    {formData.items_data.map((field, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Item {index + 1}</h4>
                                {formData.items_data.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveItem(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                            <div className="flex item-center gap-2 flex-wrap">

                                <SelectField
                                    label="Product"
                                    name={`items.${index}.product_id`}
                                    options={products}
                                    value={field.product_id}
                                    containerClassName="w-[49%]"
                                    onValueChange={handleChangeProduct(index)}
                                    error={errors[`items.${index}.product_id`]}
                                    extraSearchParam={["barcode"]}
                                    showSearch
                                />
                                <SelectField
                                    label="Warehouse"
                                    name={`items.${index}.warehouse_id`}
                                    options={warehouses}
                                    value={field?.warehouse_id}
                                    containerClassName="w-[49%]"
                                    onValueChange={handleChangeWarehouse(index)}
                                    error={errors[`items.${index}.warehouse_id`]}
                                    showSearch
                                    preSelectFirstKey
                                />
                                <Input
                                    type="number"
                                    containerClassName="w-[49%]"
                                    min="1"
                                    value={field.quantity}
                                    label="Quantity"
                                    name="quantity"
                                    onChange={handleItemsChange(index)}
                                    error={errors[`items.${index}.quantity`]}
                                />
                                <Input
                                    type="number"
                                    containerClassName="w-[49%]"
                                    min="1"
                                    value={field.unit_price}
                                    label="Unit Price"
                                    name="unit_price"
                                    onChange={handleItemsChange(index)}
                                    error={errors[`items.${index}.unit_price`]}
                                />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Subtotal: {formatEGP((formData.items_data[index]?.quantity || 0) * (formData.items_data[index]?.unit_price || 0))}
                            </div>
                        </div>
                    ))}
                    <Textarea
                        placeholder="Add any notes about this purchase..."
                        label="Notes (Optional)"
                        name="notes"
                        value={formData.notes || ""}
                        onChange={handleChange}
                    />
                </div>
                <DialogFooter>
                    <div className="flex items-center justify-between pt-4 border-t w-full">
                        <div className="text-lg font-semibold">
                            Total: {formatEGP(formData.items_data.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleSave}
                                disabled={isPending}
                            >
                                {isPending ? (previousData ? "Updating..." : "Adding...") : (previousData ? "Update" : "Add")}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleCancel}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
