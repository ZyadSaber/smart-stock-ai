export interface SalesReportFilters {
  dateFrom?: string;
  dateTo?: string;
  customer_id?: string;
  organization_id?: string;
  branch_id?: string;
}

export interface PurchaseReportFilters {
  dateFrom?: string;
  dateTo?: string;
  supplier_id?: string;
  organization_id?: string;
  branch_id?: string;
}

export interface StockReportFilters {
  product_id?: string;
  warehouse_id?: string;
  organization_id?: string;
  branch_id?: string;
}

export interface StockData {
  id: string;
  quantity: number;
  product_id: string;
  warehouse_id: string;
  products?: { name: string; barcode: string; cost_price: number };
  warehouses?: { name: string };
}

export interface StockMovement {
  id: string;
  quantity: number;
  notes: string;
  created_at: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  products?: { name: string; barcode: string };
  from_warehouse?: { name: string };
  to_warehouse?: { name: string };
}

export interface SalesHistoryItem {
  id: string;
  product_name: string;
  product_barcode: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_cost: number;
  total_sale: number;
  profit: number;
  created_at: string;
}

export interface StockReportCardsData {
  warehouseStats: { quantity: number; value: number; name: string }[];
  topItems: {
    warehouseName: string;
    items: { name: string; quantity: number }[];
  }[];
  lowStock: { name: string; quantity: number; warehouse: string }[];
  latestSales: { name: string; quantity: number; time: string }[];
}

export interface StockReportProps {
  products: { key: string; label: string }[];
  warehouses: { key: string; label: string }[];
}
