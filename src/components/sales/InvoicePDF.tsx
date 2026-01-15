"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { formatEGP } from "@/lib/utils";
import { Sale, SaleItem } from "@/types/sales";

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: "#374151",
        lineHeight: 1.5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 40,
        borderBottomWidth: 2,
        borderBottomColor: "#3B82F6",
        paddingBottom: 20,
    },
    logoSection: {
        flexDirection: "column",
    },
    companyName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1E3A8A",
        marginBottom: 14,
    },
    companyTagline: {
        fontSize: 8,
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    invoiceInfo: {
        textAlign: "right",
    },
    invoiceTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
        marginBottom: 2,
    },
    infoLabel: {
        color: "#6B7280",
    },
    infoValue: {
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 12,
        textTransform: "uppercase",
    },
    billingSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
    },
    billTo: {
        flex: 1,
    },
    table: {
        width: "auto",
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#EFF6FF",
        borderBottomWidth: 1,
        borderBottomColor: "#BFDBFE",
        padding: 8,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        padding: 8,
        alignItems: "center",
    },
    colProduct: { flex: 4 },
    colQty: { flex: 1, textAlign: "center" },
    colPrice: { flex: 1.5, textAlign: "right" },
    colTotal: { flex: 1.5, textAlign: "right" },
    headerText: {
        fontWeight: "bold",
        color: "#1E40AF",
    },
    totalsSection: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
    },
    totalsTable: {
        width: 200,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    grandTotalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        marginTop: 10,
        borderTopWidth: 2,
        borderTopColor: "#3B82F6",
        backgroundColor: "#F8FAFC",
        paddingHorizontal: 8,
    },
    grandTotalText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1E3A8A",
    },
    footer: {
        position: "absolute",
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: "center",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 20,
    },
    footerText: {
        fontSize: 8,
        color: "#9CA3AF",
    },
    notes: {
        marginTop: 40,
        padding: 12,
        backgroundColor: "#F9FAFB",
        borderRadius: 4,
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#4B5563",
    },
    notesText: {
        fontSize: 8,
        color: "#6B7280",
    }
});

// interface InvoiceItem {
//     product_name: string;
//     barcode?: string;
//     quantity: number;
//     unit_price: number;
// }

// interface InvoiceSale {
//     id: string;
//     created_at: string;
//     customer_name: string | null;
//     total_amount: number;
//     notes: string | null;
//     seller_name: string;
//     items: InvoiceItem[];
// }

// interface InvoicePDFProps {
//     sale: InvoiceSale;
// }

export const InvoicePDF = ({ sale }: { sale: Sale }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoSection}>
                    <Text style={styles.companyName}>{sale.organization_name}</Text>
                    <Text style={styles.companyTagline}>{sale.branch_name}</Text>
                </View>
                <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceTitle}>INVOICE</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Invoice #:</Text>
                        <Text style={styles.infoValue}>{sale.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Date:</Text>
                        <Text style={styles.infoValue}>{format(new Date(sale.created_at), "MMM dd, yyyy")}</Text>
                    </View>
                </View>
            </View>

            {/* Billing */}
            <View style={styles.billingSection}>
                <View style={styles.billTo}>
                    <Text style={styles.sectionTitle}>Bill To:</Text>
                    <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 4 }}>
                        {sale.customer_name || "Guest Customer"}
                    </Text>
                </View>
                <View style={{ textAlign: "right" }}>
                    <Text style={styles.sectionTitle}>Salesperson:</Text>
                    <Text>{sale.created_by_user}</Text>
                </View>
            </View>

            {/* Items Table */}
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <View style={styles.colProduct}><Text style={styles.headerText}>PRODUCT DESCRIPTION</Text></View>
                    <View style={styles.colQty}><Text style={styles.headerText}>QTY</Text></View>
                    <View style={styles.colPrice}><Text style={styles.headerText}>PRICE</Text></View>
                    <View style={styles.colTotal}><Text style={styles.headerText}>TOTAL</Text></View>
                </View>

                {sale.items_data.map((item: SaleItem, index: number) => (
                    <View key={index} style={styles.tableRow}>
                        <View style={styles.colProduct}>
                            <Text style={{ fontWeight: "bold" }}>{item.products?.name}</Text>
                            {item.products?.barcode && <Text style={{ fontSize: 8, color: "#9CA3AF" }}>SKU: {item.products?.barcode}</Text>}
                        </View>
                        <View style={styles.colQty}><Text>{item.quantity}</Text></View>
                        <View style={styles.colPrice}><Text>{formatEGP(item.unit_price)}</Text></View>
                        <View style={styles.colTotal}><Text>{formatEGP(item.unit_price * item.quantity)}</Text></View>
                    </View>
                ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
                <View style={styles.totalsTable}>
                    <View style={styles.totalRow}>
                        <Text style={styles.infoLabel}>Subtotal</Text>
                        <Text style={styles.infoValue}>{formatEGP(sale.total_amount)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.infoLabel}>Discount</Text>
                        <Text style={styles.infoValue}>{formatEGP(0)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalText}>TOTAL</Text>
                        <Text style={styles.grandTotalText}>{formatEGP(sale.total_amount)}</Text>
                    </View>
                </View>
            </View>

            {/* Notes */}
            {sale.notes && (
                <View style={styles.notes}>
                    <Text style={styles.notesTitle}>NOTES & ADDITIONAL INFORMATION:</Text>
                    <Text style={styles.notesText}>{sale.notes}</Text>
                </View>
            )}

            {/* Footer */}
            {/* <View style={styles.footer}>
                <Text style={styles.footerText}>Thank you for your business!</Text>
                <Text style={[styles.footerText, { marginTop: 4 }]}>
                    SmartStock AI - Modern Solutions for Smart Businesses
                </Text>
            </View> */}
        </Page>
    </Document>
);
