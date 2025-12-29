export interface Sale {
  id: string;
  customer_name?: string;
  notes?: string;
  total_amount: number;
  profit_amount: number;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  };
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
  id: string;
  name: string;
  selling_price: number;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface SaleOrderDialogProps {
  products: SaleProduct[];
  warehouses: Warehouse[];
}
