export interface PurchaseProduct {
  id: string;
  name: string;
  cost_price: number;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_name: string;
  total_amount: string;
  notes: string | null;
  created_at: string;
  created_by_user?: {
    full_name: string | null;
  };
}

export interface PurchaseOrderItem {
  id: string;
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
}
