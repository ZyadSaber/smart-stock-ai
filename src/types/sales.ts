export interface Sale {
  id: string;
  customer_id?: string;
  customer_name?: string;
  notes?: string;
  total_amount: number;
  profit_amount: number;
  created_at: string;
  user_id: string;
  created_by_user: string;
  items_data: SaleItem[];
  organization_name: string;
  branch_name: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  unit_price: number;
  products?: {
    name: string;
    barcode: string;
  } | null;
  warehouses?: {
    name: string;
  } | null;
}

export interface SaleProduct {
  key: string;
  label: string;
  selling_price: number;
  barcode: string;
}

export interface Warehouse {
  key: string;
  label: string;
}

export interface Customers {
  key: string;
  label: string;
}

export interface SaleOrderDialogProps {
  products: SaleProduct[];
  warehouses: Warehouse[];
  customers: Customers[];
  previousData?: Sale;
}

export interface SalesHistoryTableProps {
  initialSales: Sale[];
  products: SaleProduct[];
  warehouses: Warehouse[];
  customers: Customers[];
}
