"use client";

import { useTransition } from "react";
import { createBranchAction, updateBranchAction } from "@/app/(dashboard)/users/actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react"
import { Loader2, Building2 } from "lucide-react";
import { useVisibility, useFormManager } from "@/hooks";
import { BRANCH_FORM_INITIAL_DATA } from "./constants";
import { branchSchema } from "@/lib/validations/users";
import { Branches } from "@/types/user";

export function AddBranchDialog({ organizationId, branch }: { organizationId: string, branch?: Branches }) {
    const { visible, handleStateChange, handleClose } = useVisibility();
    const [isPending, startTransition] = useTransition();
    const { formData, handleChange, resetForm, validate, errors } = useFormManager({
        schema: branchSchema,
        initialData: {
            ...BRANCH_FORM_INITIAL_DATA,
            ...branch,
            organization_id: organizationId,
        }
    })

    const handleCloseModal = () => {
        handleClose()
        resetForm()
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return
        startTransition(async () => {
            const result = isEditMode ? await updateBranchAction(formData as Branches) : await createBranchAction(formData as Branches);
            if (result.error) {
                console.error("Failed to " + (isEditMode ? "update" : "create") + " branch:", result.error);
                toast.error(result.error);
            } else {
                toast.success("Branch " + (isEditMode ? "updated" : "created") + " successfully.");
                handleClose()
                resetForm()
            }
        });
    };

    const isEditMode = !!branch;

    return (
        <Dialog open={visible} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                {isEditMode ? <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                    <Pencil className="h-4 w-4" />
                </Button> :
                    <Button className="gap-2" size="icon" variant="ghost">
                        <Building2 className="h-4 w-4" />
                    </Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Branch" : "Add New Branch"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <Input
                        id="name"
                        placeholder="exp. Smart Stock AI"
                        value={formData.name}
                        onChange={handleChange}
                        name="name"
                        error={errors.name}
                        label="Branch Name"
                    />
                    <Input
                        id="location"
                        placeholder="exp. Smart Stock AI"
                        value={formData.location}
                        onChange={handleChange}
                        name="location"
                        error={errors.location}
                        label="Loaction"
                    />
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? "Update Organization" : "Create Organization"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
