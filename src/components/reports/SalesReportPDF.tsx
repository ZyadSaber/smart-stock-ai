"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { formatEGP } from "@/lib/utils";


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
    statSub: {
        fontSize: 8,
        color: "#9CA3AF",
        fontStyle: "italic",
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
    colDate: { width: "15%" },
    colCustomer: { width: "30%" },
    colAmount: { width: "20%", textAlign: "right" },
    colProfit: { width: "20%", textAlign: "right" },
});

import { Sale } from "@/types/sales";

export interface SalesReportData {
    filtered_stats: {
        total_sales: number;
        total_revenue: number;
        total_profit: number;
    };
    dateFrom: string | null;
    dateTo: string | null;
    customer_id: string;
    sales: Sale[];
    today_count: number;
    yesterday_count: number;
    last_15_days_count: number;
    last_30_days_count: number;
    avg_invoice_value: number;
    profit_margin_percent: number;
    total_sales: number;
    total_revenue: number;
    total_profit: number;
    topSellingCustomers: {
        customer_name: string;
        total_invoices: number;
        net_invoices_total: number;
        total_profit: number;
    }[];
}

interface SalesReportPDFProps {
    data: SalesReportData;
}

export const SalesReportPDF = ({ data }: SalesReportPDFProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Sales Report</Text>
                <Text style={styles.subtitle}>Generated on {format(new Date(), "PPP p")}</Text>
            </View>

            {/* Lifetime Performance Overview */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lifetime Performance Overview </Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Sales</Text>
                        <Text style={styles.statValue}>{data.total_sales || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Revenue</Text>
                        <Text style={{ ...styles.statValue, color: "#16a34a" }}>
                            {data.total_revenue || 0}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Profit</Text>
                        <Text style={{ ...styles.statValue, color: "#9333ea" }}>
                            {data.total_profit || 0}
                        </Text>
                    </View>
                    <View style={{ ...styles.statCard, marginTop: 10 }}>
                        <Text style={styles.statLabel}>Avg. Invoice Value</Text>
                        <Text style={styles.statValue}>{formatEGP(data.avg_invoice_value || 0)}</Text>
                    </View>
                    <View style={{ ...styles.statCard, marginTop: 10 }}>
                        <Text style={styles.statLabel}>Profit Margin</Text>
                        <Text style={styles.statValue}>{(data.profit_margin_percent || 0).toFixed(1)}%</Text>
                    </View>
                </View>
            </View>

            {/* Invoice Frequency */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invoice Frequency</Text>
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
                <Text style={styles.sectionTitle}>Performance Overview {data.dateFrom && `(${data.dateFrom} - ${data.dateTo})`}</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Sales</Text>
                        <Text style={styles.statValue}>{data.filtered_stats?.total_sales || 0}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Revenue</Text>
                        <Text style={{ ...styles.statValue, color: "#16a34a" }}>
                            {formatEGP(data.filtered_stats?.total_revenue || 0)}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Profit</Text>
                        <Text style={{ ...styles.statValue, color: "#9333ea" }}>
                            {formatEGP(data.filtered_stats?.total_profit || 0)}
                        </Text>
                    </View>

                    <View style={{ ...styles.statCard, marginTop: 10 }}>
                        <Text style={styles.statLabel}>Avg. Invoice Value</Text>
                        <Text style={styles.statValue}>{formatEGP(data.avg_invoice_value || 0)}</Text>
                    </View>
                    <View style={{ ...styles.statCard, marginTop: 10 }}>
                        <Text style={styles.statLabel}>Profit Margin</Text>
                        <Text style={styles.statValue}>{(data.profit_margin_percent || 0).toFixed(1)}%</Text>
                    </View>
                </View>
            </View>}

            {/* Invoices Table */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detailed Invoices</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colId, { fontWeight: "bold" }]}>Invoice #</Text>
                        <Text style={[styles.colDate, { fontWeight: "bold" }]}>Date</Text>
                        <Text style={[styles.colCustomer, { fontWeight: "bold" }]}>Customer</Text>
                        <Text style={[styles.colAmount, { fontWeight: "bold" }]}>Amount</Text>
                        <Text style={[styles.colProfit, { fontWeight: "bold" }]}>Profit</Text>
                    </View>
                    {data.sales?.map((sale: Sale) => (
                        <View key={sale.id} style={styles.tableRow}>
                            <Text style={styles.colId}>{sale.id.slice(0, 8)}</Text>
                            <Text style={styles.colDate}>{format(new Date(sale.created_at), "dd/MM/yyyy")}</Text>
                            <Text style={styles.colCustomer}>{sale.customer_name || "Walk-in"}</Text>
                            <Text style={styles.colAmount}>{formatEGP(sale.total_amount)}</Text>
                            <Text style={[styles.colProfit, { color: "#16a34a" }]}>{formatEGP(sale.profit_amount)}</Text>
                        </View>
                    ))}
                    {(!data.sales || data.sales.length === 0) && (
                        <View style={styles.tableRow}>
                            <Text style={{ width: "100%", textAlign: "center", fontStyle: "italic", color: "#9CA3AF" }}>
                                No filtered invoices found.
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Page>
    </Document>
);
