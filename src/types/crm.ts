export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}
