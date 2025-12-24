export interface Product {
  id: string;
  name: string;
  barcode: string;
  cost_price: number;
  selling_price: number;
  updated_at: string;
}

export interface WarehouseValuation {
  total_cost: number;
  total_revenue: number;
  projected_profit: number;
}
