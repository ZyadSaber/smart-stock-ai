"use client";

import { useTransition } from "react";
import { saleSchema, type SaleItemInput } from "@/lib/validations/sale";
import { SelectField } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createSaleAction } from "@/services/sales";
import { SaleOrderDialogProps } from "@/types/sales";
import { cn, formatEGP } from "@/lib/utils";
import { useVisibility, useFormManager } from "@/hooks";
import { addSaleDefaultValues } from "./constants";
import AddCustomerDialog from "../customers/AddCustomerDialog";

export function SaleOrderDialog({ products, warehouses, customers, previousData }: SaleOrderDialogProps) {
    const [isPending, startTransition] = useTransition();
    const { visible, handleClose, handleStateChange } = useVisibility()
    const { formData, handleChange, handleFieldChange, resetForm, validate, errors } = useFormManager({
        schema: saleSchema,
        initialData: {
            ...addSaleDefaultValues,
            ...previousData
        }
    })

    async function handleSave() {
        if (!validate()) return
        startTransition(async () => {
            const result = await createSaleAction(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Sale completed successfully!");
                resetForm()
                handleClose()
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

    const handleChangeProduct = (index: number) => (value: string) => {
        const computedItems = [...formData.items_data] as SaleItemInput[]
        const product = products.find(p => p.key === value)
        computedItems[index]["product_id"] = value
        computedItems[index]["unit_price"] = product?.selling_price || 0
        handleFieldChange({
            name: "items_data",
            value: computedItems
        })
    }

    const handleChangeWarehouse = (index: number) => (value: string) => {
        const computedItems = [...formData.items_data] as SaleItemInput[]
        computedItems[index]["warehouse_id"] = value
        handleFieldChange({
            name: "items_data",
            value: computedItems
        })
    }

    const handleItemsChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target

        const computedItems = [...formData.items_data] as SaleItemInput[]
        //@ts-expect-error ignore this
        computedItems[index][name as keyof SaleItemInput] = parseInt(value)
        handleFieldChange({
            name: "items_data",
            value: computedItems
        })
    }

    const totalAmount = formData.items_data.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
    }, 0);

    return (
        <Dialog open={visible} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                <Button
                    variant={previousData ? "ghost" : "default"}
                    className={cn(
                        "gap-2",
                        !!previousData ? "" : "bg-green-600 hover:bg-green-700"
                    )}>
                    {!!previousData ? <Pencil className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    {!!previousData ? "" : "New Sale"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Process New Sale</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                        label="Customer Name"
                        name="customer_id"
                        options={customers}
                        value={formData.customer_id || ""}
                        containerClassName="w-[100%]"
                        placeholder="Ex: ABC Suppliers Ltd."
                        onValueChange={(value) => {
                            handleFieldChange({ name: "customer_id", value });
                        }}
                        error={errors.supplier_id || errors.supplier_name}
                        showSearch
                        renderAddField={(onSuccess: (id: string) => void) => (
                            <AddCustomerDialog onSuccess={onSuccess} />
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Sale Items</h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddItem}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Item
                        </Button>
                    </div>

                    {formData.items_data.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/20">
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
                                    value={item.product_id}
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
                                    value={item.warehouse_id}
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
                                    value={item.quantity}
                                    label="Quantity"
                                    name="quantity"
                                    onChange={handleItemsChange(index)}
                                    error={errors[`items.${index}.quantity`]}
                                />

                                <Input
                                    type="number"
                                    containerClassName="w-[49%]"
                                    min="1"
                                    step="0.01"
                                    value={item.unit_price}
                                    label="Unit Price"
                                    name="unit_price"
                                    onChange={handleItemsChange(index)}
                                    error={errors[`items.${index}.unit_price`]}
                                />
                            </div>

                            <div className="text-sm font-medium text-right">
                                Subtotal: {formatEGP((formData.items_data[index]?.quantity || 0) * (formData.items_data[index]?.unit_price || 0))}
                            </div>
                        </div>
                    ))}
                </div>

                <Textarea
                    placeholder="Specific details or customer requests..."
                    label="Notes (Optional)"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                />

                <div className="flex items-center justify-between pt-4 border-t sticky bottom-0 bg-background pb-2 mt-4">
                    <div className="text-xl font-bold">
                        Total: {formatEGP(totalAmount)}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSave} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Complete Sale"
                            )}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClose}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
