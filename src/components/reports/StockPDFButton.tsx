"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { StockReportPDF, StockReportData } from "./StockReportPDF";

interface StockPDFButtonProps {
    data: StockReportData;
    isLoading?: boolean;
}

const StockPDFButton = ({ data, isLoading }: StockPDFButtonProps) => {
    return (
        <PDFDownloadLink
            document={<StockReportPDF data={data} />}
            fileName={`stock_report_${new Date().toISOString().split('T')[0]}.pdf`}
            className="flex-1"
        >
            {({ loading }) => (
                <Button
                    variant="outline"
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 border-red-200 hover:border-red-300"
                    disabled={loading || isLoading}
                    title="Download PDF Report"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <FileText className="h-4 w-4 md:mr-2" />
                    )}
                    <span className="hidden md:inline">PDF</span>
                </Button>
            )}
        </PDFDownloadLink>
    );
};

export default StockPDFButton;
