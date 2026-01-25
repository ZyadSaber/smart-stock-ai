import {
  StockData,
  StockMovement,
  SalesHistoryItem,
  StockReportCardsData,
} from "@/types/reports";
import { PurchaseOrder } from "@/types/purchases";
import { Sale } from "@/types/sales";
import { getTodayDateString } from "@/lib/utils";

const today = getTodayDateString();

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
  total_purchases: 0,
  total_spending: 0,
  avg_purchase_value: 0,
  filterd_stats: {
    total_purchases: 0,
    total_amount: 0,
  },
  topPurchaseSuppliers: [] as {
    supplier_name: string;
    total_orders: number;
    total_spent: number;
    avg_order_value: number;
  }[],
  today_count: 0,
  yesterday_count: 0,
  last_15_days_count: 0,
  last_30_days_count: 0,
};

export const initiaSalesReportData = {
  filtered_stats: {
    total_sales: 0,
    total_revenue: 0,
    total_profit: 0,
  },
  dateFrom: today,
  dateTo: today,
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
