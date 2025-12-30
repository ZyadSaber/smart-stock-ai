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
    ReferenceLine,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StockFlowChartProps {
    data: {
        date: string;
        inbound: number;
        outbound: number;
    }[];
}

export function StockFlowChart({ data }: StockFlowChartProps) {
    if (data.length === 0) {
        return (
            <Card className="col-span-4 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Inbound vs Outbound Flow</CardTitle>
                    <CardDescription>Daily item movement quantity.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No activity recorded.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-4 lg:col-span-4">
            <CardHeader>
                <CardTitle>Inbound vs Outbound Flow</CardTitle>
                <CardDescription>
                    Compare received goods (Inbound) vs sold goods (Outbound) per day.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="mb-2 text-sm font-semibold text-muted-foreground">
                                                {label && new Date(label).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Inbound
                                                    </span>
                                                    <span className="font-bold text-green-600">
                                                        +{payload[0]?.value}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Outbound
                                                    </span>
                                                    <span className="font-bold text-orange-600">
                                                        -{payload[1]?.value}
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
                        <ReferenceLine y={0} stroke="#000" />
                        <Bar
                            dataKey="inbound"
                            name="Inbound (Received)"
                            fill="#22c55e"  // Green-500
                            stackId="a"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="outbound"
                            name="Outbound (Sold)"
                            fill="#f97316"  // Orange-500
                            stackId="b"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
