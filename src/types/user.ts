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
  organization_id?: string;
  organizations: { name: string };
  branch_id?: string;
  branches: { name: string };
}

export interface Branches {
  id: string;
  name: string;
  location: string;
  organization_id: string;
}
export interface Organizations {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  active: boolean;
  branches: Branches[];
}

export interface EditPermissionsDrawerProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationsList: { key: string; label: string }[];
  branchesList: { key: string; label: string; organization_id: string }[];
}

export interface UsersTableProps {
  users: UserProfile[];
  organizationsList: { key: string; label: string }[];
  branchesList: { key: string; label: string; organization_id: string }[];
}
