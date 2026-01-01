'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { deleteBranchAction } from "@/app/(dashboard)/users/actions";
import { toast } from "sonner";
import { useVisibility } from "@/hooks";
import { Branches } from '@/types/user';


export function DeleteBranchDialog({ branch }: { branch: Branches }) {
    const { visible, handleStateChange, handleClose } = useVisibility();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteBranchAction(branch.id);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Organization deleted successfully.");
                handleClose();
            }
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={visible} onOpenChange={handleStateChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Branch</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <span className="font-semibold">{branch.name}</span>?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
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
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
