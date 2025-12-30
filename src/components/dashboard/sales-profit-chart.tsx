"use client";

import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sale } from "@/types/sales";
import { formatEGP } from "@/lib/utils";

interface SalesProfitChartProps {
    sales: Sale[];
}

export function SalesProfitChart({ sales }: SalesProfitChartProps) {
    // Process data: Group by date and sum amounts
    const chartData = useMemo(() => {
        const grouped = sales.reduce((acc, sale) => {
            // Format date as YYYY-MM-DD for grouping
            const date = new Date(sale.created_at).toLocaleDateString("en-CA");

            if (!acc[date]) {
                acc[date] = { date, total_amount: 0, profit_amount: 0 };
            }

            acc[date].total_amount += Number(sale.total_amount);
            acc[date].profit_amount += Number(sale.profit_amount);

            return acc;
        }, {} as Record<string, { date: string; total_amount: number; profit_amount: number }>);

        // Convert to array and sort by date ascending
        return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [sales]);

    if (sales.length === 0) {
        return (
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Sales & Profit Trends</CardTitle>
                    <CardDescription>Visualizing revenue vs net profit over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No sales data available to chart.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Sales & Profit Trends</CardTitle>
                <CardDescription>
                    Compare your Total Revenue against Net Profit to track margins.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                            }}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatEGP(value)}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Revenue
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                        {formatEGP(payload[0].value as number)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Profit
                                                    </span>
                                                    <span className="font-bold text-green-600">
                                                        {formatEGP(payload[1].value as number)}
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
                        <Line
                            type="monotone"
                            dataKey="total_amount"
                            name="Total Revenue"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="profit_amount"
                            name="Net Profit"
                            stroke="#16a34a"  // Green-600
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
