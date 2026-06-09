"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DeleteConfirmationModal({
    open,
    onOpenChange,
    title = "Delete item",
    description = "Are you sure you want to delete this item? This action cannot be undone.",
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    loading = false,
    loadingLabel = "Deleting...",
    onConfirm,
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose >
                        <Button variant="outline" type="button" disabled={loading}>
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button type="button" variant="destructive" disabled={loading} onClick={onConfirm}>
                        {loading ? loadingLabel : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
