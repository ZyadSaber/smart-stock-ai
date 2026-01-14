export interface PurchaseProduct {
  key: string;
  label: string;
  cost_price: number;
  barcode?: string;
}

export interface Warehouse {
  key: string;
  label: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name: string;
  total_amount: string;
  notes: string | null;
  created_at: string;
  created_by_user?: string | null;
  items_data: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    barcode: string;
  } | null;
  warehouses: {
    name: string;
  } | null;
}

export interface PurchaseOrderDialogProps {
  products: PurchaseProduct[];
  warehouses: Warehouse[];
  suppliers: Supplier[];
  previousData?: PurchaseOrder;
}

export interface Supplier {
  key: string;
  label: string;
}
