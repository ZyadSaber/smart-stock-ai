export type UserRole = "admin" | "manager" | "cashier";

export interface UserPermissions {
  can_view_reports: boolean;
  can_edit_inventory: boolean;
  can_manage_users: boolean;
  dashboard?: boolean;
  inventory?: boolean;
  warehouses?: boolean;
  "stock-movements"?: boolean;
  purchases?: boolean;
  sales?: boolean;
  users?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  permissions: UserPermissions;
  updated_at: string;
}
