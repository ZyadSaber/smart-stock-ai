"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { formatEGP } from "@/lib/utils";
import { PurchaseOrder } from "@/types/purchases";

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
    statCard4: {
        width: "23.5%",
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
    colId: { width: "15%" },
    colDate: { width: "20%" },
    colSupplier: { width: "35%" },
    colAmount: { width: "30%", textAlign: "right" },
});

export interface PurchaseReportData {
    dateFrom: string;
    dateTo: string;
    supplier_id: string;
    purchases: PurchaseOrder[];
    total_purchases: number;
    total_spending: number;
    avg_purchase_value: number;
    filterd_stats: {
        total_purchases: number;
        total_amount: number;
    };
    topPurchaseSuppliers: {
        supplier_name: string;
        total_orders: number;
        total_spent: number;
        avg_order_value: number;
    }[];
    today_count: number;
    yesterday_count: number;
    last_15_days_count: number;
    last_30_days_count: number;
}

interface PurchaseReportPDFProps {
    data: PurchaseReportData;
}

export const PurchaseReportPDF = ({ data }: PurchaseReportPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Purchase Report</Text>
                <Text style={styles.subtitle}>Generated on {format(new Date(), "PPP p")}</Text>
            </View>

            {/* Efficiency Insights */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Efficiency Insights</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Purchases</Text>
                        <Text style={styles.statValue}>{data.total_purchases || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Spending</Text>
                        <Text style={{ ...styles.statValue, color: "#ea580c" }}>
                            {formatEGP(data.total_spending || 0)}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg. Purchase Value</Text>
                        <Text style={styles.statValue}>{formatEGP(data.avg_purchase_value || 0)}</Text>
                    </View>
                </View>
            </View>

            {/* Purchase Frequency */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Purchase Frequency</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard4}>
                        <Text style={styles.statLabel}>Today</Text>
                        <Text style={styles.statValue}>{data.today_count || 0}</Text>
                    </View>
                    <View style={styles.statCard4}>
                        <Text style={styles.statLabel}>Yesterday</Text>
                        <Text style={styles.statValue}>{data.yesterday_count || 0}</Text>
                    </View>
                    <View style={styles.statCard4}>
                        <Text style={styles.statLabel}>Last 15 Days</Text>
                        <Text style={styles.statValue}>{data.last_15_days_count || 0}</Text>
                    </View>
                    <View style={styles.statCard4}>
                        <Text style={styles.statLabel}>Last 30 Days</Text>
                        <Text style={styles.statValue}>{data.last_30_days_count || 0}</Text>
                    </View>
                </View>
            </View>

            {/* Summary Information */}
            {(data.dateFrom || data.dateTo) && <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Overview {data.dateFrom && `(${data.dateFrom} - ${data.dateTo || 'Now'})`}</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Filtered Orders</Text>
                        <Text style={styles.statValue}>{data.filterd_stats?.total_purchases || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Filtered Spending</Text>
                        <Text style={{ ...styles.statValue, color: "#ea580c" }}>
                            {formatEGP(data.filterd_stats?.total_amount || 0)}
                        </Text>
                    </View>
                </View>
            </View>}

            {/* Orders Table */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detailed Purchase Orders</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colId, { fontWeight: "bold" }]}>Order #</Text>
                        <Text style={[styles.colDate, { fontWeight: "bold" }]}>Date</Text>
                        <Text style={[styles.colSupplier, { fontWeight: "bold" }]}>Supplier</Text>
                        <Text style={[styles.colAmount, { fontWeight: "bold" }]}>Amount</Text>
                    </View>
                    {data.purchases?.map((po: PurchaseOrder) => (
                        <View key={po.id} style={styles.tableRow}>
                            <Text style={styles.colId}>{po.id.slice(0, 8)}</Text>
                            <Text style={styles.colDate}>{format(new Date(po.created_at), "dd/MM/yyyy")}</Text>
                            <Text style={styles.colSupplier}>{po.supplier_name}</Text>
                            <Text style={styles.colAmount}>{formatEGP(Number(po.total_amount))}</Text>
                        </View>
                    ))}
                    {(!data.purchases || data.purchases.length === 0) && (
                        <View style={styles.tableRow}>
                            <Text style={{ width: "100%", textAlign: "center", fontStyle: "italic", color: "#9CA3AF" }}>
                                No filtered orders found.
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Page>
    </Document>
);
