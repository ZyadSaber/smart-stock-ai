import {
  StockData,
  StockMovement,
  SalesHistoryItem,
  StockReportCardsData,
} from "@/types/reports";
import { PurchaseOrder } from "@/types/purchases";
import { Sale } from "@/types/sales";

export const initialStockReportData = {
  product_id: "",
  warehouse_id: "",
  stocks: [] as StockData[],
  movements: [] as StockMovement[],
  salesHistory: [] as SalesHistoryItem[],
  cardsData: null as StockReportCardsData | null,
};

export const initialPurchaseReportData = {
  dateFrom: "",
  dateTo: "",
  supplier_id: "",
  purchases: [] as PurchaseOrder[],
  cardsData: null as {
    stats: Record<string, number>;
    summary: { totalPurchases: number; totalSpending: number };
    additionalMetrics: {
      avgPurchaseValue: number;
      avgItemsPerInvoice: number;
      topSupplier: string;
    };
  } | null,
};

export const initiaSalesReportData = {
  filtered_stats: {
    total_sales: 0,
    total_revenue: 0,
    total_profit: 0,
  },
  dateFrom: null,
  dateTo: null,
  customer_id: "",
  sales: [] as Sale[],
  today_count: 0,
  yesterday_count: 0,
  last_15_days_count: 0,
  last_30_days_count: 0,
  avg_invoice_value: 0,
  profit_margin_percent: 0,
  total_sales: 0,
  total_revenue: 0,
  total_profit: 0,
  topSellingCustomers: [] as {
    customer_name: string;
    total_invoices: number;
    net_invoices_total: number;
    total_profit: number;
  }[],
};
