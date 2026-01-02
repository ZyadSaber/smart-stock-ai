-- ========================================================
-- FIX: ADD BRANCH_ID TO PRODUCT_STOCKS
-- ========================================================
-- Description: Adds branch_id to product_stocks to support 
-- efficient branch-level filtering and resolves the missing column error.
-- ========================================================

BEGIN;

-- 1. Add branch_id column
ALTER TABLE product_stocks ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- 2. Populate branch_id from warehouses
UPDATE product_stocks ps
SET branch_id = w.branch_id
FROM warehouses w
WHERE ps.warehouse_id = w.id;

-- 3. Set default for existing records if any still null (optional safety)
UPDATE product_stocks
SET branch_id = '00000000-0000-0000-0000-000000000001'
WHERE branch_id IS NULL;

-- 4. Create trigger to auto-populate branch_id on new stock records
CREATE OR REPLACE FUNCTION sync_product_stock_branch()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.branch_id IS NULL THEN
        SELECT branch_id INTO NEW.branch_id 
        FROM warehouses WHERE id = NEW.warehouse_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_product_stock_branch ON product_stocks;
CREATE TRIGGER tr_sync_product_stock_branch
BEFORE INSERT OR UPDATE OF warehouse_id ON product_stocks
FOR EACH ROW EXECUTE PROCEDURE sync_product_stock_branch();

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_stocks_branch ON product_stocks(branch_id);

COMMIT;
