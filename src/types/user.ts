export interface UserPermissions {
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
  permissions: UserPermissions;
  updated_at: string;
  is_super_admin: boolean;
}

export interface Branches {
  id: string;
  name: string;
  location: string;
  organization_id: string;
}
export interface Orgazniations {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  branches: [];
}
