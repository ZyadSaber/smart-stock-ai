-- ========================================================
-- MULTI-TENANCY HIERARCHY MIGRATION
-- ========================================================
-- Description: Adds Organizations (Clients), Branches, and Super-Admin 
-- support. Implements hierarchical data isolation via RLS.
-- ========================================================

BEGIN;

-- 1. Create Organizations (Clients)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Branches (Locations)
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Profiles with Hierarchy and Super-Admin
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- 4. Add Linkage to Operational Tables
-- Organization level (shared catalog)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Branch level (isolated operations)
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- 5. Helper Function for RLS
CREATE OR REPLACE FUNCTION get_auth_profile()
RETURNS TABLE (
    is_super_admin BOOLEAN,
    organization_id UUID,
    branch_id UUID
) AS $$
BEGIN
    RETURN QUERY SELECT p.is_super_admin, p.organization_id, p.branch_id 
    FROM profiles p WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update RLS Policies
-- NOTE: We drop existing policies and recreate them with hierarchy support.

-- Example for Categories (Org Level)
DROP POLICY IF EXISTS "Select access for all authenticated users" ON categories;
CREATE POLICY "Multi-tenant access for categories" ON categories
FOR ALL TO authenticated
USING (
    (SELECT is_super_admin FROM get_auth_profile()) OR
    (organization_id = (SELECT organization_id FROM get_auth_profile()))
)
WITH CHECK (
    (SELECT is_super_admin FROM get_auth_profile()) OR
    (organization_id = (SELECT organization_id FROM get_auth_profile()))
);

-- Example for Warehouses (Branch Level)
DROP POLICY IF EXISTS "Select access for all authenticated users" ON warehouses;
CREATE POLICY "Multi-tenant access for warehouses" ON warehouses
FOR ALL TO authenticated
USING (
    (SELECT is_super_admin FROM get_auth_profile()) OR
    (
        organization_id = (SELECT organization_id FROM get_auth_profile()) AND
        (branch_id = (SELECT branch_id FROM get_auth_profile()) OR (SELECT branch_id FROM get_auth_profile()) IS NULL)
    )
)
WITH CHECK (
    (SELECT is_super_admin FROM get_auth_profile()) OR
    (
        organization_id = (SELECT organization_id FROM get_auth_profile()) AND
        (branch_id = (SELECT branch_id FROM get_auth_profile()) OR (SELECT branch_id FROM get_auth_profile()) IS NULL)
    )
);

-- (Repeat for other tables in final validation)

COMMIT;
