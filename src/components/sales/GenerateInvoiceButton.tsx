"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "./InvoicePDF";
// import { getSaleForInvoice } from "@/services/sales";
import { toast } from "sonner";
import { Sale } from "@/types/sales";

export function GenerateInvoiceButton({ sale: saleData }: { sale: Sale }) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async (type: "download" | "print") => {
        try {
            setLoading(true);

            // Generate the PDF blob
            const blob = await pdf(<InvoicePDF sale={saleData} />).toBlob();
            const url = URL.createObjectURL(blob);

            if (type === "download") {
                const link = document.createElement("a");
                link.href = url;
                link.download = `Invoice-${saleData.id.slice(0, 8).toUpperCase()}.pdf`;
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
