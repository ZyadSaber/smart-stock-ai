"use client";

import React, { useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Check, X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import useFormManager from "@/hooks/useFormManager";

interface ExcelImportModalProps {
    onDataImport: (data: Record<string, unknown>[]) => void;
    title?: string;
    description?: string;
    triggerButtonText?: string;
    triggerButtonClassName?: string;
}

type ImportState = {
    data: Record<string, unknown>[];
    headers: string[];
    fileName: string | null;
    isOpen: boolean;
} & Record<string, unknown>;

export function ExcelImportModal({
    onDataImport,
    title = "Import Excel Data",
    description = "Upload an Excel file to preview and import your data.",
    triggerButtonText = "Import Excel",
    triggerButtonClassName,
}: ExcelImportModalProps) {
    const { formData, resetForm, handleFieldChange } = useFormManager<ImportState>({
        initialData: {
            data: [],
            headers: [],
            fileName: null,
            isOpen: false,
        }
    });

    const { data, headers, fileName, isOpen } = formData;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        handleFieldChange({ name: "fileName", value: file.name });
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const bstr = event.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const raw_data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

                if (raw_data.length > 0) {
                    const headerRow = raw_data[0] as string[];
                    const rows = raw_data.slice(1).map((row: unknown[]) => {
                        const obj: Record<string, unknown> = {};
                        headerRow.forEach((header, index) => {
                            obj[header] = row[index];
                        });
                        return obj;
                    });

                    handleFieldChange({ name: "headers", value: headerRow });
                    handleFieldChange({ name: "data", value: rows });
                }
            } catch (error) {
                console.error("Error reading excel file:", error);
                toast.error("Failed to parse Excel file. Please make sure it's a valid .xlsx or .xls file.");
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleSave = () => {
        if (data.length === 0) {
            toast.error("No data to import.");
            return;
        }
        onDataImport(data);
        toast.success(`${data.length} rows imported successfully!`);
        resetState();
        handleFieldChange({ name: "isOpen", value: false });
    };

    const resetState = () => {
        resetForm();
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            handleFieldChange({ name: "isOpen", value: open });
            if (!open) resetState();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className={cn("gap-2", triggerButtonClassName)}>
                    <FileSpreadsheet className="h-4 w-4" />
                    {triggerButtonText}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-muted/30 border-b">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Upload className="h-5 w-5 text-primary" />
                        </div>
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 p-6 space-y-6 overflow-hidden flex flex-col">
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer",
                            fileName ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />

                        {fileName ? (
                            <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                                <div className="p-4 bg-primary/20 rounded-full">
                                    <Check className="h-8 w-8 text-primary" />
                                </div>
                                <p className="font-semibold text-lg">{fileName}</p>
                                <Button variant="ghost" size="sm" onClick={(e) => {
                                    e.stopPropagation();
                                    resetState();
                                }} className="text-muted-foreground hover:text-destructive">
                                    Change file
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center space-y-2">
                                <div className="mx-auto p-4 bg-muted rounded-full w-fit group-hover:scale-110 transition-transform">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-lg font-medium">Click to upload or drag and drop</p>
                                <p className="text-sm text-muted-foreground">Support .xlsx and .xls files</p>
                            </div>
                        )}
                    </div>

                    {data.length > 0 && (
                        <div className="flex-1 flex flex-col min-h-0 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    Data Preview
                                    <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                        {data.length} rows found
                                    </span>
                                </h3>
                            </div>

                            <div className="flex-1 border rounded-xl overflow-hidden bg-card">
                                <div className="overflow-auto max-h-[300px]">
                                    <Table>
                                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                            <TableRow>
                                                {headers.map((header) => (
                                                    <TableHead key={header} className="whitespace-nowrap font-bold text-foreground">
                                                        {header}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.map((row, i) => (
                                                <TableRow key={i} className="hover:bg-muted/30">
                                                    {headers.map((header) => (
                                                        <TableCell key={header} className="whitespace-nowrap max-w-[200px] truncate">
                                                            {String(row[header] ?? "")}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-muted/30 border-t">
                    <Button variant="ghost" onClick={() => handleFieldChange({ name: "isOpen", value: false })} className="gap-2">
                        <X className="h-4 w-4" />
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={data.length === 0}
                        className="gap-2 shadow-lg shadow-primary/20"
                    >
                        <Check className="h-4 w-4" />
                        Confirm Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
