export interface PurchaseProduct {
  id: string;
  name: string;
  cost_price: number;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface PurchaseOrderDialogProps {
  products: PurchaseProduct[];
  warehouses: Warehouse[];
}
