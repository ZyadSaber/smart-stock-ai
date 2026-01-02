"use client";

import { useTransition } from "react";
import { updatePermissionsAction, deleteUserAction, updatePasswordAction } from "@/app/(dashboard)/users/actions";
import { UserPermissions, EditPermissionsDrawerProps } from "@/types/user";
import { toast } from "sonner";
import { Trash2, AlertTriangle, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select";
import { useFormManager } from "@/hooks";
import { USER_FORM_INITIAL_DATA } from "./constants";



export function EditPermissionsDrawer({ user, open, onOpenChange, organizationsList, branchesList }: EditPermissionsDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const { formData, handleFieldChange, handleChange } = useFormManager({
        initialData: {
            ...USER_FORM_INITIAL_DATA,
            ...user,
        }
    });

    const { permissions, newPassword, isDeleting, isUpdatingPassword, showDeleteConfirm, organization_id, branch_id } = formData;

    const filteredBranches = branchesList.filter(branch => branch.organization_id === organization_id);

    const handleToggle = (key: keyof UserPermissions) => {
        handleFieldChange({
            name: "permissions",
            value: {
                ...permissions,
                [key]: !permissions[key]
            }
        });
    };

    const handleSave = () => {
        if (!user) return;
        startTransition(async () => {
            const pResult = await updatePermissionsAction(user.id, {
                permissions,
                organization_id: organization_id || "",
                branch_id: branch_id || ""
            });

            if (pResult.error) {
                toast.error(pResult.error);
            } else {
                toast.success("User profile and permissions updated successfully");
                onOpenChange(false);
            }
        });
    };

    const handleUpdatePassword = async () => {
        if (!user || !newPassword) return;
        handleFieldChange({ name: "isUpdatingPassword", value: true });
        const result = await updatePasswordAction(user.id, newPassword);
        handleFieldChange({ name: "isUpdatingPassword", value: false });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Password updated successfully");
            handleFieldChange({ name: "newPassword", value: "" });
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        handleFieldChange({ name: "isDeleting", value: true });
        const result = await deleteUserAction(user.id);
        handleFieldChange({ name: "isDeleting", value: false });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("User deleted successfully");
            onOpenChange(false);
        }
    };

    if (!user) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader className="p-3">
                    <SheetTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Manage User
                    </SheetTitle>
                    <SheetDescription>
                        Update role and permissions for <strong>{user.full_name || 'User'}</strong>
                    </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-3">
                    <SelectField
                        label="Organization"
                        name="organization_id"
                        options={organizationsList}
                        value={organization_id}
                        onValueChange={(value) => {
                            handleFieldChange({ name: "organization_id", value });
                            handleFieldChange({ name: "branch_id", value: "" });
                        }}
                        disabled={formData?.is_super_admin}
                    />

                    <SelectField
                        label="Branch"
                        name="branch_id"
                        options={filteredBranches}
                        value={branch_id}
                        onValueChange={(value) => handleFieldChange({ name: "branch_id", value })}
                        disabled={!organization_id || formData?.is_super_admin}
                    />
                </div>

                <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold mb-3 px-1 opacity-70">Navigation Access</h4>
                    <div className="grid grid-cols-2 gap-3">
                        {['dashboard', 'inventory', 'warehouses', 'stock-movements', 'purchases', 'sales'].map((item) => (
                            <div key={item} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/30">
                                <Switch
                                    checked={!!permissions[item as keyof UserPermissions]}
                                    onCheckedChange={() => handleToggle(item as keyof UserPermissions)}
                                />
                                <Label className="text-xs capitalize">{item.replace('-', ' ')}</Label>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-3 mt-4 space-y-4">
                        <div className="flex items-center gap-2 px-1 text-primary">
                            <KeyRound className="h-4 w-4" />
                            <h4 className="text-sm font-semibold">Security Settings</h4>
                        </div>
                        <div className="space-y-2 px-1">
                            <Label className="text-xs opacity-70">Reset Password</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="password"
                                    placeholder="New Password"
                                    className="h-9"
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={handleChange}
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={!newPassword || isUpdatingPassword}
                                    onClick={handleUpdatePassword}
                                >
                                    {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset"}
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic px-1">
                                Minimum 6 characters recommended.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-2 pt-6 border-t space-y-4">
                    <div className="flex gap-3">
                        <Button
                            className="flex-1"
                            onClick={handleSave}
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update User
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    </div>

                    {!showDeleteConfirm ? (
                        <Button
                            variant="ghost"
                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleFieldChange({ name: "showDeleteConfirm", value: true })}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                        </Button>
                    ) : (
                        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-3">
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Danger Zone</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                All data associated with this user will be permanently removed. This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delete"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleFieldChange({ name: "showDeleteConfirm", value: false })}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
