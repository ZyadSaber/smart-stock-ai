"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TopProductsChartProps {
    data: {
        name: string;
        quantity: number;
    }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function TopProductsChart({ data }: TopProductsChartProps) {
    if (data.length === 0) {
        return (
            <Card className="col-span-4 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Top Performing Products</CardTitle>
                    <CardDescription>Highest quantity sold.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No sales data available.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Top Performing Products</CardTitle>
                <CardDescription>
                    Identify your &quot;Star&quot; products by sales volume.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    {/* Setting layout="vertical" makes it a horizontal bar chart */}
                    <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                    {payload[0].payload.name}
                                                </span>
                                                <span className="font-bold">
                                                    {payload[0].value} units sold
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar
                            dataKey="quantity"
                            name="Units Sold"
                            radius={[0, 4, 4, 0]}
                            barSize={32}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
