"use client";

import { useTransition } from "react";
import { createOrganizationAction, updateOrganizationAction } from "@/app/(dashboard)/users/actions";
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
import { Loader2, UserPlus } from "lucide-react";
import { useVisibility, useFormManager } from "@/hooks";
import { ORGANIZATION_FORM_INITIAL_DATA } from "./constants";
import { organizationSchema } from "@/lib/validations/users";
import { Orgazniations } from "@/types/user";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AddOrganizationDialog({ organization }: { organization?: Orgazniations }) {
    const { visible, handleStateChange, handleClose } = useVisibility();
    const [isPending, startTransition] = useTransition();
    const { formData, handleChange, resetForm, validate, errors, handleToggle } = useFormManager({
        schema: organizationSchema,
        initialData: {
            ...ORGANIZATION_FORM_INITIAL_DATA,
            ...organization
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
            const result = isEditMode ? await updateOrganizationAction(formData as Orgazniations) : await createOrganizationAction(formData);
            if (result.error) {
                console.error("Failed to " + (isEditMode ? "update" : "create") + " organization:", result.error);
                toast.error(result.error);
            } else {
                toast.success("Organization " + (isEditMode ? "updated" : "created") + " successfully.");
                handleClose()
                resetForm()
            }
        });
    };

    const isEditMode = !!organization;

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
                    <Button className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add New Organization
                    </Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Edit Organization" : "Add New Organization"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <Input
                        id="name"
                        placeholder="exp. Smart Stock AI"
                        value={formData.name}
                        onChange={handleChange}
                        name="name"
                        error={errors.name}
                        label="Organization Name"
                    />
                    <div className="flex items-center space-x-2">
                        <Switch id="airplane-mode" checked={formData.active} onCheckedChange={handleToggle("active")} />
                        <Label htmlFor="airplane-mode">Active</Label>
                    </div>
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
