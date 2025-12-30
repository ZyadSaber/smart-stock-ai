"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "./InvoicePDF";
import { getSaleForInvoice } from "@/app/(dashboard)/sales/actions";
import { toast } from "sonner";

interface GenerateInvoiceButtonProps {
    saleId: string;
    variant?: "outline" | "default" | "ghost" | "secondary";
    className?: string;
    showIconOnly?: boolean;
}

export function GenerateInvoiceButton({
    saleId,
    variant = "outline",
    className,
    showIconOnly = false
}: GenerateInvoiceButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (type: "download" | "print") => {
        try {
            setLoading(true);
            const saleData = await getSaleForInvoice(saleId);

            if (!saleData) {
                toast.error("Failed to load sale data for invoice.");
                return;
            }

            // Generate the PDF blob
            const blob = await pdf(<InvoicePDF sale={saleData} />).toBlob();
            const url = URL.createObjectURL(blob);

            if (type === "download") {
                const link = document.createElement("a");
                link.href = url;
                link.download = `Invoice-${saleId.slice(0, 8).toUpperCase()}.pdf`;
                link.click();
                toast.success("Invoice downloaded successfully!");
            } else {
                const newWindow = window.open(url, "_blank");
                if (newWindow) {
                    newWindow.onload = () => {
                        newWindow.print();
                    };
                } else {
                    toast.error("Pop-up blocked. Please allow pop-ups for this site.");
                }
            }

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error("Invoice Generation Error:", error);
            toast.error("An error occurred while generating the invoice.");
        } finally {
            setLoading(false);
        }
    };

    if (showIconOnly) {
        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={loading}
                    onClick={() => handleGenerate("download")}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Download Invoice"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={loading}
                    onClick={() => handleGenerate("print")}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    title="Print Invoice"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                </Button>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Button
                variant={variant}
                size="sm"
                disabled={loading}
                onClick={() => handleGenerate("download")}
                className="gap-2"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                Download Invoice
            </Button>
            <Button
                variant={variant}
                size="sm"
                disabled={loading}
                onClick={() => handleGenerate("print")}
                className="gap-2"
            >
                <Printer className="h-4 w-4" />
                Print
            </Button>
        </div>
    );
}
