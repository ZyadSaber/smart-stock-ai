"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEGP } from "@/lib/utils";

interface WarehouseValuationChartProps {
    data: {
        name: string;
        total_cost: number;
        total_revenue: number;
        projected_profit: number;
    }[];
}

export function WarehouseValuationChart({ data }: WarehouseValuationChartProps) {
    if (data.length === 0) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Warehouse Valuation</CardTitle>
                    <CardDescription>Capital distribution across locations.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No warehouse data available.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Inventory Valuation</CardTitle>
                <CardDescription>
                    Cost vs Revenue Potential per Warehouse.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Cost
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                        {formatEGP(Number(payload[0].value))}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Recall Value
                                                    </span>
                                                    <span className="font-bold text-blue-600">
                                                        {formatEGP(Number(payload[1].value))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                        <Bar
                            dataKey="total_cost"
                            name="Total Cost"
                            fill="hsl(var(--muted-foreground))"
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        />
                        <Bar
                            dataKey="total_revenue"
                            name="Selling Potential"
                            fill="#2563eb" // Blue-600
                            radius={[0, 4, 4, 0]}
                            barSize={20}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
