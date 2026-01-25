"use client"

import { useTransition, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Package, Search, RotateCcw, Loader2 } from "lucide-react"
import { StockMovementDialog } from "./stock-movement-dialog"
import { DeleteMovementDialog } from "./delete-movement-dialog"
import { useFormManager } from "@/hooks"
import { initialStockMovementsData } from "@/components/reports/constants"
import { getStockMovementsPageData } from "@/services/stock-movements"
import { resolveActionData } from "@/lib/page-utils"
import { StockMovement } from "@/types/stock-movements"

interface StockMovementsViewProps {
    initialMovements: StockMovement[]
    products: { id: string; name: string }[]
    warehouses: { id: string; name: string }[]
}

export const StockMovementsView = ({ initialMovements, products, warehouses }: StockMovementsViewProps) => {
    const searchParams = useSearchParams()
    const [isLoading, startTransition] = useTransition()

    const { formData, handleChange, resetForm, handleChangeMultiInputs } = useFormManager({
        initialData: {
            ...initialStockMovementsData,
            movements: initialMovements,
            products,
            warehouses
        }
    })

    const handleSearch = useCallback(() => {
        startTransition(async () => {
            const data = await resolveActionData(
                getStockMovementsPageData,
                searchParams,
                {
                    date_from: formData.date_from,
                    date_to: formData.date_to
                }
            );

            if (data) {
                handleChangeMultiInputs({
                    movements: data.movements
                });
            }
        });
    }, [formData.date_from, formData.date_to, handleChangeMultiInputs, searchParams]);

    const handleReset = () => {
        resetForm()
        handleSearch()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
                    <p className="text-muted-foreground">Track stock transfers between warehouses.</p>
                </div>
                <StockMovementDialog
                    products={products}
                    warehouses={warehouses}
                />
            </div>

            {/* Search Container */}
            <Card className="border-none shadow-sm shadow-black/5 bg-card/60 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Search className="h-5 w-5 text-primary" />
                        Search Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <Input
                            type="date"
                            label="Date From"
                            name="date_from"
                            value={formData.date_from || ""}
                            onChange={handleChange}
                        />
                        <Input
                            type="date"
                            label="Date To"
                            name="date_to"
                            value={formData.date_to || ""}
                            onChange={handleChange}
                        />
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                className="flex-2 bg-primary hover:bg-primary/90"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4 mr-2" />
                                )}
                                Research
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleReset}
                                disabled={isLoading}
                                title="Clear Filters"
                            >
                                <RotateCcw className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Clear</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Movement History</CardTitle>
                    <CardDescription>
                        All stock transfers and movements are recorded here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                <span>Searching movements...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (formData.movements).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                            No stock movements recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (formData.movements).map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell className="font-mono text-xs text-nowrap">
                                                {new Date(movement.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                    {movement.products?.name || 'Unknown'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {movement.from_warehouse?.name || 'New Stock'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {movement.to_warehouse?.name || 'Removed'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge>{movement.quantity}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {movement.notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {movement.created_by_user?.full_name || 'Unknown'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <StockMovementDialog
                                                        products={products}
                                                        warehouses={warehouses}
                                                        movement={{
                                                            id: movement.id,
                                                            product_id: movement.product_id,
                                                            from_warehouse_id: movement.from_warehouse_id,
                                                            to_warehouse_id: movement.to_warehouse_id,
                                                            quantity: movement.quantity,
                                                            notes: movement.notes
                                                        }}
                                                    />
                                                    <DeleteMovementDialog movementId={movement.id} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
