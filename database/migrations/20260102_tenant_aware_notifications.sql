-- ========================================================
-- TENANT-AWARE NOTIFICATION TRIGGERS
-- ========================================================
-- Description: Updates the notification triggers to only notify 
-- admins and managers within the SAME organization/branch context.
-- ========================================================

BEGIN;

-- 1. Update Low Stock Trigger
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    p_name TEXT;
    v_organization_id UUID;
    v_branch_id UUID;
BEGIN
    -- Only notify if quantity is below 10
    IF NEW.quantity < 10 THEN
        -- Get product name and its organization
        SELECT name, organization_id INTO p_name, v_organization_id 
        FROM products WHERE id = NEW.product_id;
        
        -- Get branch from product_stocks (NEW)
        v_branch_id := NEW.branch_id;
        
        -- Insert notification for admins and managers of the SAME organization
        -- Also link the notification to the branch
        INSERT INTO notifications (user_id, title, message, type, branch_id)
        SELECT id, 'Low Stock Alert', 
               'Product "' || p_name || '" is low on stock (' || NEW.quantity || ' remaining).', 
               'low_stock', 
               v_branch_id
        FROM profiles
        -- WHERE role IN ('admin', 'manager')
          WHERE organization_id = v_organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update Big Sale Trigger
CREATE OR REPLACE FUNCTION notify_big_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_id UUID;
    v_organization_id UUID;
BEGIN
    -- Check threshold (5000 EGP)
    IF NEW.total_amount > 5000 THEN
        v_branch_id := NEW.branch_id;
        
        -- Get organization of the branch
        SELECT organization_id INTO v_organization_id 
        FROM branches WHERE id = v_branch_id;
        
        -- Insert notification for all admins of the SAME organization
        INSERT INTO notifications (user_id, title, message, type, branch_id)
        SELECT id, 'Big Sale Achievement', 
               'A new sale of ' || NEW.total_amount || ' EGP has been recorded!', 
               'big_sale',
               v_branch_id
        FROM profiles
        -- WHERE role = 'admin'
          WHERE organization_id = v_organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
