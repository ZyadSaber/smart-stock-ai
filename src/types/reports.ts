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
  product_name: string;
  product_barcode: string;
  quantity: number;
  warehouse_name: string;
  barcode: string;
  stock_level: number;
  last_cost: number;
  total_inventory_value: number;
}

export interface StockMovement {
  id: string;
  quantity: number;
  notes: string;
  product_name: string;
  barcode: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  from_warehouse_name: string;
  to_warehouse_name: string;
  created_at: string;
}

export interface SalesHistoryItem {
  id: string;
  product_name: string;
  product_barcode: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_cost: number;
  total_sales: number;
  profit: number;
  created_at: string;
}

export interface StockReportCardsData {
  warehouseStats: {
    items_quantity: number;
    name: string;
    total_products: number;
    total_stock_valuation: number;
  }[];
  topItems: {
    warehouse_name: string;
    product_name: string;
    total_quantity_sold: number;
  }[];
  lowStock: {
    product_name: string;
    stock_level: number;
    warehouse_name: string;
  }[];
  latestSales: {
    product_name: string;
    quantity: number;
    created_at: string;
  }[];
}

export interface StockReportProps {
  products: { key: string; label: string }[];
  warehouses: { key: string; label: string }[];
}
