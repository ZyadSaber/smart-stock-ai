"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { formatEGP } from "@/lib/utils";
import { StockData, StockMovement, SalesHistoryItem, StockReportCardsData } from "@/types/reports";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#374151",
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
        color: "#111827",
    },
    subtitle: {
        fontSize: 10,
        color: "#6B7280",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 10,
        backgroundColor: "#F3F4F6",
        padding: 5,
        color: "#111827",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    statCard: {
        width: "30%",
        padding: 10,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 4,
    },
    statLabel: {
        fontSize: 8,
        color: "#6B7280",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#111827",
    },
    // Chart Styles
    chartContainer: {
        height: 150,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-around",
        padding: 10,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 10,
        backgroundColor: "#fff",
    },
    barContainer: {
        alignItems: "center",
        flex: 1,
        marginHorizontal: 2,
    },
    bar: {
        width: "60%",
        backgroundColor: "#3b82f6",
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
    barLabel: {
        fontSize: 8,
        marginTop: 4,
        textAlign: 'center',
        color: "#6B7280",
    },
    barValue: {
        fontSize: 8,
        marginBottom: 2,
        fontWeight: 'bold',
    },
    // Insights Grid
    insightsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    insightCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 4,
        padding: 8,
    },
    insightTitle: {
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#111827",
        textTransform: "uppercase",
    },
    insightItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        paddingVertical: 4,
    },
    table: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#F3F4F6",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        padding: 6,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        padding: 6,
    },
    // Columns
    colProduct: { width: "30%" },
    colWarehouse: { width: "25%" },
    colQty: { width: "15%", textAlign: "right" },
    colCost: { width: "15%", textAlign: "right" },
    colValue: { width: "15%", textAlign: "right" },

    colType: { width: "15%" },
    colPath: { width: "35%" },
    colDate: { width: "15%", textAlign: "right" },
});

export interface StockReportData {
    stocks: StockData[];
    movements: StockMovement[];
    salesHistory: SalesHistoryItem[];
    cardsData: StockReportCardsData | null;
}

interface StockReportPDFProps {
    data: StockReportData;
}

export const StockReportPDF = ({ data }: StockReportPDFProps) => {
    // Helpers for Chart
    const maxStockValue = data.cardsData?.warehouseStats
        ? Math.max(...data.cardsData.warehouseStats.map(w => w.items_quantity)) || 1
        : 1;

    const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Stock & Inventory Report</Text>
                    <Text style={styles.subtitle}>Generated on {format(new Date(), "PPP p")}</Text>
                </View>

                {/* Overview Stats */}
                {data.cardsData && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Inventory Valuation</Text>
                        <View style={styles.statsGrid}>
                            {data.cardsData.warehouseStats.map((stat, idx) => (
                                <View key={idx} style={styles.statCard}>
                                    <Text style={styles.statLabel}>{stat.name}</Text>
                                    <Text style={styles.statValue}>{formatEGP(stat.total_stock_valuation)}</Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                        <Text style={{ fontSize: 8, color: "#9CA3AF" }}>{stat.total_products} items</Text>
                                        <Text style={{ fontSize: 8, color: "#9CA3AF" }}>Vol: {stat.items_quantity}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Stock Distribution Chart */}
                {data.cardsData && data.cardsData.warehouseStats.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Stock Distribution (Volume)</Text>
                        <View style={styles.chartContainer}>
                            {data.cardsData.warehouseStats.map((stat, idx) => {
                                const heightPercentage = (stat.items_quantity / maxStockValue) * 100;
                                return (
                                    <View key={idx} style={styles.barContainer}>
                                        <Text style={styles.barValue}>{stat.items_quantity}</Text>
                                        <View style={[
                                            styles.bar,
                                            {
                                                height: `${heightPercentage}%`,
                                                backgroundColor: chartColors[idx % chartColors.length]
                                            }
                                        ]} />
                                        <Text style={styles.barLabel} numberOfLines={1}>{stat.name}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Dashboard Insights Grid */}
                {data.cardsData && (
                    <View style={styles.section}>
                        <View style={styles.insightsRow}>
                            {/* Top Items */}
                            <View style={styles.insightCard}>
                                <Text style={styles.insightTitle}>Top Items / Warehouse</Text>
                                {data.cardsData.topItems.map((item, idx) => (
                                    <View key={idx} style={styles.insightItem}>
                                        <View style={{ flex: 1, paddingRight: 4 }}>
                                            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{item.warehouse_name}</Text>
                                            <Text style={{ fontSize: 8, color: '#6B7280' }}>{item.product_name}</Text>
                                        </View>
                                        <Text style={{ fontSize: 9, color: '#10b981', fontWeight: 'bold' }}>x{item.total_quantity_sold}</Text>
                                    </View>
                                ))}
                                {data.cardsData.topItems.length === 0 && <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#9CA3AF' }}>No data</Text>}
                            </View>

                            {/* Low Stock */}
                            <View style={styles.insightCard}>
                                <Text style={styles.insightTitle}>Low Stock Alert</Text>
                                {data.cardsData.lowStock.map((item, idx) => (
                                    <View key={idx} style={styles.insightItem}>
                                        <View style={{ flex: 1, paddingRight: 4 }}>
                                            <Text style={{ fontSize: 8 }}>{item.product_name}</Text>
                                            <Text style={{ fontSize: 7, color: '#6B7280' }}>{item.warehouse_name}</Text>
                                        </View>
                                        <Text style={{ fontSize: 9, color: '#ea580c', fontWeight: 'bold' }}>{item.stock_level}</Text>
                                    </View>
                                ))}
                                {data.cardsData.lowStock.length === 0 && <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#9CA3AF' }}>All good!</Text>}
                            </View>

                            {/* Latest Sales */}
                            <View style={styles.insightCard}>
                                <Text style={styles.insightTitle}>Latest Sales</Text>
                                {data.cardsData.latestSales.map((item, idx) => (
                                    <View key={idx} style={styles.insightItem}>
                                        <View style={{ flex: 1, paddingRight: 4 }}>
                                            <Text style={{ fontSize: 8 }}>{item.product_name}</Text>
                                            <Text style={{ fontSize: 7, color: '#6B7280' }}>{format(new Date(item.created_at), 'p')}</Text>
                                        </View>
                                        <Text style={{ fontSize: 9, color: '#3b82f6' }}>x{item.quantity}</Text>
                                    </View>
                                ))}
                                {data.cardsData.latestSales.length === 0 && <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#9CA3AF' }}>No recent sales</Text>}
                            </View>
                        </View>
                    </View>
                )}

                {/* Stock Levels Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Stock Levels</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colProduct, { fontWeight: "bold" }]}>Product</Text>
                            <Text style={[styles.colWarehouse, { fontWeight: "bold" }]}>Warehouse</Text>
                            <Text style={[styles.colQty, { fontWeight: "bold" }]}>Qty</Text>
                            <Text style={[styles.colCost, { fontWeight: "bold" }]}>Unit Cost</Text>
                            <Text style={[styles.colValue, { fontWeight: "bold" }]}>Total Value</Text>
                        </View>
                        {data.stocks?.map((s) => (
                            <View key={s.id} style={styles.tableRow}>
                                <Text style={styles.colProduct}>{s.product_name}</Text>
                                <Text style={styles.colWarehouse}>{s.warehouse_name}</Text>
                                <Text style={styles.colQty}>{s.stock_level}</Text>
                                <Text style={styles.colCost}>{formatEGP(s.last_cost || 0)}</Text>
                                <Text style={[styles.colValue, { color: "#2563EB" }]}>{formatEGP(s.total_inventory_value)}</Text>
                            </View>
                        ))}
                        {(!data.stocks || data.stocks.length === 0) && (
                            <View style={styles.tableRow}>
                                <Text style={{ width: "100%", textAlign: "center", fontStyle: "italic", color: "#9CA3AF" }}>
                                    No stock data found.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Sales History Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sales History & Profitability</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colProduct, { fontWeight: "bold" }]}>Product</Text>
                            <Text style={[{ width: '15%' }, { fontWeight: "bold" }]}>Date</Text>
                            <Text style={[styles.colQty, { fontWeight: "bold" }]}>Qty</Text>
                            <Text style={[styles.colCost, { fontWeight: "bold" }]}>Unit Price</Text>
                            <Text style={[styles.colValue, { fontWeight: "bold" }]}>Profit</Text>
                        </View>
                        {data.salesHistory?.map((s) => (
                            <View key={s.id} style={styles.tableRow}>
                                <Text style={styles.colProduct}>{s.product_name}</Text>
                                <Text style={{ width: '15%' }}>{format(new Date(s.created_at), "dd/MM")}</Text>
                                <Text style={styles.colQty}>{s.quantity}</Text>
                                <Text style={styles.colCost}>{formatEGP(s.unit_price)}</Text>
                                <Text style={[styles.colValue, { color: s.profit >= 0 ? "#10b981" : "#ef4444" }]}>{formatEGP(s.profit)}</Text>
                            </View>
                        ))}
                        {(!data.salesHistory || data.salesHistory.length === 0) && (
                            <View style={styles.tableRow}>
                                <Text style={{ width: "100%", textAlign: "center", fontStyle: "italic", color: "#9CA3AF" }}>
                                    No sales history found.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Recent Movements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Stock Movements</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.colType, { fontWeight: "bold" }]}>Type</Text>
                            <Text style={[styles.colProduct, { fontWeight: "bold" }]}>Product</Text>
                            <Text style={[styles.colPath, { fontWeight: "bold" }]}>Path</Text>
                            <Text style={[styles.colQty, { fontWeight: "bold" }]}>Qty</Text>
                            <Text style={[styles.colDate, { fontWeight: "bold" }]}>Date</Text>
                        </View>
                        {data.movements?.map((m) => (
                            <View key={m.id} style={styles.tableRow}>
                                <Text style={styles.colType}>
                                    {!m.from_warehouse_id && m.to_warehouse_id ? "IN" :
                                        m.from_warehouse_id && !m.to_warehouse_id ? "OUT" : "TRANSFER"}
                                </Text>
                                <Text style={styles.colProduct}>{m.product_name}</Text>
                                <Text style={styles.colPath}>
                                    {m.from_warehouse_name || "System"} &rarr; {m.to_warehouse_name || "Customer/Supplier"}
                                </Text>
                                <Text style={styles.colQty}>{m.quantity}</Text>
                                <Text style={styles.colDate}>{format(new Date(m.created_at), "dd/MM/yyyy")}</Text>
                            </View>
                        ))}
                        {(!data.movements || data.movements.length === 0) && (
                            <View style={styles.tableRow}>
                                <Text style={{ width: "100%", textAlign: "center", fontStyle: "italic", color: "#9CA3AF" }}>
                                    No movements found.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
};
