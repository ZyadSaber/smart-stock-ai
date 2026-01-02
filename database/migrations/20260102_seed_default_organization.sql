-- ========================================================
-- SEED DEFAULT ORGANIZATION AND MIGRATE EXISTING DATA
-- ========================================================
-- Description: Creates a default organization and branch for existing data
-- and updates all existing records to belong to this default tenant.
-- Run this ONCE before enabling multi-tenancy filtering.
-- ========================================================

BEGIN;

-- 1. Add active column to organizations if it doesn't exist
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 2. Create default organization (using a fixed UUID for consistency)
INSERT INTO organizations (id, name, active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create default branch under the default organization
INSERT INTO branches (id, organization_id, name, location, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Main Branch',
  'Default Location',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Update existing profiles to belong to default organization/branch
-- (Skip super admins - they don't need org/branch assignment)
UPDATE profiles 
SET 
  organization_id = '00000000-0000-0000-0000-000000000001',
  branch_id = '00000000-0000-0000-0000-000000000001'
WHERE 
  organization_id IS NULL 
  AND (is_super_admin IS NULL OR is_super_admin = FALSE);

-- 5. Update organization-level tables (shared catalog)
UPDATE categories 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

UPDATE products 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- 6. Update branch-level tables (isolated operations)
UPDATE warehouses 
SET branch_id = '00000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL;

UPDATE sales 
SET branch_id = '00000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL;

UPDATE purchase_orders 
SET branch_id = '00000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL;

UPDATE stock_movements 
SET branch_id = '00000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL;

UPDATE notifications 
SET branch_id = '00000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL;

-- 7. Verify migration
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  -- Check for orphaned categories
  SELECT COUNT(*) INTO orphan_count FROM categories WHERE organization_id IS NULL;
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % categories without organization_id', orphan_count;
  END IF;
  
  -- Check for orphaned products
  SELECT COUNT(*) INTO orphan_count FROM products WHERE organization_id IS NULL;
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % products without organization_id', orphan_count;
  END IF;
  
  -- Check for orphaned warehouses
  SELECT COUNT(*) INTO orphan_count FROM warehouses WHERE branch_id IS NULL;
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % warehouses without branch_id', orphan_count;
  END IF;
  
  -- Check for orphaned sales
  SELECT COUNT(*) INTO orphan_count FROM sales WHERE branch_id IS NULL;
  IF orphan_count > 0 THEN
    RAISE WARNING 'Found % sales without branch_id', orphan_count;
  END IF;
  
  RAISE NOTICE 'Migration verification complete';
END $$;

COMMIT;

-- ========================================================
-- OPTIONAL: Make columns NOT NULL (run after verification)
-- ========================================================
-- Uncomment these lines after verifying all data has been migrated

-- ALTER TABLE categories ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE warehouses ALTER COLUMN branch_id SET NOT NULL;
-- ALTER TABLE sales ALTER COLUMN branch_id SET NOT NULL;
-- ALTER TABLE purchase_orders ALTER COLUMN branch_id SET NOT NULL;
-- ALTER TABLE stock_movements ALTER COLUMN branch_id SET NOT NULL;
