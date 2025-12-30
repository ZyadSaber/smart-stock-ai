-- ========================================================
-- NOTIFICATION SYSTEM SCHEMA
-- ========================================================

-- 1. Create Notification Type Enum (Optional, but good for consistency)
-- DROP TYPE IF EXISTS notification_type;
-- CREATE TYPE notification_type AS ENUM ('low_stock', 'big_sale', 'system');

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('low_stock', 'big_sale', 'system')) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can only see their own notifications" 
ON notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)" 
ON notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Triggers for Automatic Notifications

-- A. Low Stock Trigger
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    p_name TEXT;
    admin_user_id UUID;
BEGIN
    IF NEW.quantity < 10 THEN
        -- Get product name
        SELECT name INTO p_name FROM products WHERE id = NEW.product_id;
        
        -- Insert notification for all admins and managers
        INSERT INTO notifications (user_id, title, message, type)
        SELECT id, 'Low Stock Alert', 'Product "' || p_name || '" is low on stock (' || NEW.quantity || ' remaining).', 'low_stock'
        FROM profiles
        WHERE role IN ('admin', 'manager');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_low_stock_notification
AFTER INSERT OR UPDATE ON product_stocks
FOR EACH ROW EXECUTE PROCEDURE notify_low_stock();

-- B. Big Sale Trigger
CREATE OR REPLACE FUNCTION notify_big_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_amount > 5000 THEN
        -- Insert notification for all admins
        INSERT INTO notifications (user_id, title, message, type)
        SELECT id, 'Big Sale Achievement', 'A new sale of ' || NEW.total_amount || ' EGP has been recorded!', 'big_sale'
        FROM profiles
        WHERE role = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_big_sale_notification
AFTER INSERT ON sales
FOR EACH ROW EXECUTE PROCEDURE notify_big_sale();

-- C. Index for performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
