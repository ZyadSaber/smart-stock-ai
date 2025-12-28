import { ReactNode } from "react";

export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  price: number;
  stock: number;
  cost_price: number;
  selling_price: number;
  category_id: string;
  updated_at?: string;
}

export type EditableProduct = Pick<
  Product,
  "id" | "name" | "barcode" | "cost_price" | "selling_price" | "category_id"
>;

export interface Category {
  id: string;
  name: string;
}

export interface InventoryTableProps {
  products: Product[];
  categories: Category[];
}

export interface ProductDialogProps {
  categories: Category[];
  product?: EditableProduct;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface WarehouseValuation {
  total_cost: number;
  total_revenue: number;
  projected_profit: number;
}
