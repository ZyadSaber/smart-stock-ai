"use client";

import { useState, useTransition } from "react";
import { updatePermissionsAction, updateRoleAction, deleteUserAction, updatePasswordAction } from "@/app/(dashboard)/users/actions";
import { UserRole, UserPermissions, UserProfile } from "@/types/user";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface EditPermissionsDrawerProps {
    user: UserProfile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditPermissionsDrawer({ user, open, onOpenChange }: EditPermissionsDrawerProps) {
    const [isPending, startTransition] = useTransition();
    const [permissions, setPermissions] = useState<UserPermissions>(
        user?.permissions || {
            can_view_reports: false,
            can_edit_inventory: false,
            can_manage_users: false
        }
    );
    const [role, setRole] = useState<UserRole>(user?.role || "cashier");
    const [newPassword, setNewPassword] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Correct way to sync state from props in modern React
    const [prevUser, setPrevUser] = useState(user);
    if (user !== prevUser) {
        setPrevUser(user);
        setRole(user?.role || "cashier");
        setPermissions(user?.permissions || {
            can_view_reports: false,
            can_edit_inventory: false,
            can_manage_users: false
        });
        setNewPassword("");
        setShowDeleteConfirm(false);
    }

    const handleToggle = (key: keyof UserPermissions) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = () => {
        if (!user) return;
        startTransition(async () => {
            const pResult = await updatePermissionsAction(user.id, permissions);
            const rResult = await updateRoleAction(user.id, role);

            if (pResult.error || rResult.error) {
                toast.error(pResult.error || rResult.error);
            } else {
                toast.success("User updated successfully");
                onOpenChange(false);
            }
        });
    };

    const handleUpdatePassword = async () => {
        if (!user || !newPassword) return;
        setIsUpdatingPassword(true);
        const result = await updatePasswordAction(user.id, newPassword);
        setIsUpdatingPassword(false);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Password updated successfully");
            setNewPassword("");
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        setIsDeleting(true);
        const result = await deleteUserAction(user.id);
        setIsDeleting(false);

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
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Manage User
                    </SheetTitle>
                    <SheetDescription>
                        Update role and permissions for <strong>{user.full_name || 'User'}</strong>
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2 px-1">
                        <Label className="text-sm font-semibold opacity-70">User Role</Label>
                        <Select value={role} onValueChange={(val: UserRole) => setRole(val)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cashier">Cashier</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
                        <div className="space-y-0.5">
                            <Label className="text-base">View Reports</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow viewing dashboard analytics and sales reports.
                            </p>
                        </div>
                        <Switch
                            checked={permissions.can_view_reports}
                            onCheckedChange={() => handleToggle('can_view_reports')}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-4 rounded-lg border p-4 shadow-sm transition-colors hover:bg-muted/50">
                        <div className="space-y-0.5">
                            <Label className="text-base">User Management</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow adding staff and changing permissions.
                            </p>
                        </div>
                        <Switch
                            checked={permissions.can_manage_users}
                            onCheckedChange={() => handleToggle('can_manage_users')}
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3 px-1 opacity-70">Navigation Access</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {['dashboard', 'inventory', 'warehouses', 'stock-movements', 'purchases', 'sales', 'users'].map((item) => (
                                <div key={item} className="flex items-center gap-2 p-2 rounded border hover:bg-muted/30">
                                    <Switch
                                        checked={!!permissions[item as keyof UserPermissions]}
                                        onCheckedChange={() => handleToggle(item as keyof UserPermissions)}
                                    />
                                    <Label className="text-xs capitalize">{item.replace('-', ' ')}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
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
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
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

                <div className="mt-8 pt-6 border-t space-y-4">
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
                            onClick={() => setShowDeleteConfirm(true)}
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
                                    onClick={() => setShowDeleteConfirm(false)}
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
