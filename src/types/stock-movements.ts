export interface StockMovement {
  id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  product_id: string;
  from_warehouse_id: string | null;
  to_warehouse_id: string | null;
  products: {
    name: string;
    barcode: string;
  } | null;
  from_warehouse: {
    name: string;
  } | null;
  to_warehouse: {
    name: string;
  } | null;
  created_by_user: {
    full_name: string;
  } | null;
}
