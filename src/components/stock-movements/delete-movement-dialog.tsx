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
import { deleteStockMovementAction } from "@/app/(dashboard)/stock-movements/actions";
import { toast } from "sonner";

interface DeleteMovementDialogProps {
    movementId: string;
}

export function DeleteMovementDialog({ movementId }: DeleteMovementDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteStockMovementAction(movementId);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Stock movement deleted and stock levels reversed.");
                setOpen(false);
            }
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Stock Movement</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this movement record?
                        <br /><br />
                        <span className="font-semibold text-destructive">Warning:</span> Stock levels will be automatically reversed (sent back to the source warehouse).
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete & Reverse Stock"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
