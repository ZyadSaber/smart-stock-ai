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
import { Trash2 } from "lucide-react";
import { useVisibility } from "@/hooks"
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { useTransition } from "react";

interface DeleteDialogProps {
    id: string;
    deleteAction: (id: string) => Promise<{ error?: string }>;
}

const DeleteDialog = ({ id, deleteAction }: DeleteDialogProps) => {
    const { visible, handleClose, handleStateChange } = useVisibility()
    const [isDeleting, startDeleteTransition] = useTransition();

    const handleDeleteInvoice = () => {
        startDeleteTransition(async () => {
            const result = await deleteAction(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Purchase order deleted");
                handleClose();
            }
        });
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
                    <DialogTitle>Delete Record</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this record?
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
                        onClick={handleDeleteInvoice}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteDialog