-- ========================================================
-- SMART STOCK AI - PRODUCTION DATABASE SCHEMA (UNIFIED)
-- ========================================================
-- Description: Complete schema including multi-tenancy support,
-- tables, relationships, functions, triggers, and Row Level Security.
-- Date: 2026-01-02
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 3. CORE TABLES (HIERARCHICAL)
-- ========================================================

-- Organizations (Clients)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches (Locations)
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles (Extending Supabase Auth Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  is_super_admin BOOLEAN DEFAULT FALSE,
  organization_id UUID REFERENCES organizations(id),
  branch_id UUID REFERENCES branches(id),
  permissions JSONB DEFAULT '{}',
  default_page TEXT DEFAULT 'dashboard',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories (Org level)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Warehouses (Branch level)
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(branch_id, name)
);

-- Products (Org level)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, barcode)
);

-- Product Stocks (Inventory Matrix - Branch level)
CREATE TABLE IF NOT EXISTS product_stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id),
  CONSTRAINT check_quantity_non_negative CHECK (quantity >= 0)
);

-- ========================================================
-- 4. TRANSACTION TABLES
-- ========================================================

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  customer_name TEXT,
  notes TEXT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  profit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('low_stock', 'big_sale', 'system')) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- 5. INDEXES FOR PERFORMANCE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_org ON branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_stocks_product ON product_stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_warehouse ON product_stocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stocks_branch ON product_stocks(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch ON sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_po_branch ON purchase_orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_movements_branch ON stock_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- ========================================================
-- 6. FUNCTIONS & TRIGGERS
-- ========================================================

-- A. Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER tr_update_organizations BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_branches BEFORE UPDATE ON branches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_stocks BEFORE UPDATE ON product_stocks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_categories BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_warehouses BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- B. Sync branch_id from warehouse for product_stocks
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

CREATE TRIGGER tr_sync_product_stock_branch
BEFORE INSERT OR UPDATE OF warehouse_id ON product_stocks
FOR EACH ROW EXECUTE PROCEDURE sync_product_stock_branch();

-- C. Logic for Sales (Deduct Stock)
CREATE OR REPLACE FUNCTION decrease_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_stocks
  SET quantity = quantity - NEW.quantity
  WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_decrease_stock AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE PROCEDURE decrease_stock_after_sale();

-- D. Logic for Purchases (Manage Stock)
CREATE OR REPLACE FUNCTION manage_purchase_stock_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE product_stocks
    SET quantity = quantity + NEW.quantity
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    
    IF NOT FOUND THEN
      INSERT INTO product_stocks (product_id, warehouse_id, quantity)
      VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity);
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE product_stocks
    SET quantity = quantity - OLD.quantity
    WHERE product_id = OLD.product_id AND warehouse_id = OLD.warehouse_id;
    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE product_stocks
    SET quantity = quantity - OLD.quantity
    WHERE product_id = OLD.product_id AND warehouse_id = OLD.warehouse_id;

    UPDATE product_stocks
    SET quantity = quantity + NEW.quantity
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;

    IF NOT FOUND THEN
      INSERT INTO product_stocks (product_id, warehouse_id, quantity)
      VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_manage_purchase_stock
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW EXECUTE PROCEDURE manage_purchase_stock_trigger();

-- E. Logic for Stock Movements
CREATE OR REPLACE FUNCTION process_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    IF OLD.from_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity + OLD.quantity
      WHERE product_id = OLD.product_id AND warehouse_id = OLD.from_warehouse_id;
    END IF;
    IF OLD.to_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity - OLD.quantity
      WHERE product_id = OLD.product_id AND warehouse_id = OLD.to_warehouse_id;
    END IF;
    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.from_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity + OLD.quantity
      WHERE product_id = OLD.product_id AND warehouse_id = OLD.from_warehouse_id;
    END IF;
    IF OLD.to_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity - OLD.quantity
      WHERE product_id = OLD.product_id AND warehouse_id = OLD.to_warehouse_id;
    END IF;
    
    IF NEW.from_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity - NEW.quantity
      WHERE product_id = NEW.product_id AND warehouse_id = NEW.from_warehouse_id;
    END IF;
    IF NEW.to_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity + NEW.quantity
      WHERE product_id = NEW.product_id AND warehouse_id = NEW.to_warehouse_id;
      IF NOT FOUND THEN
        INSERT INTO product_stocks (product_id, warehouse_id, quantity)
        VALUES (NEW.product_id, NEW.to_warehouse_id, NEW.quantity);
      END IF;
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    IF NEW.from_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity - NEW.quantity
      WHERE product_id = NEW.product_id AND warehouse_id = NEW.from_warehouse_id;
    END IF;
    IF NEW.to_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity + NEW.quantity
      WHERE product_id = NEW.product_id AND warehouse_id = NEW.to_warehouse_id;
      IF NOT FOUND THEN
        INSERT INTO product_stocks (product_id, warehouse_id, quantity)
        VALUES (NEW.product_id, NEW.to_warehouse_id, NEW.quantity);
      END IF;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_process_stock_movement 
AFTER INSERT OR UPDATE OR DELETE ON stock_movements
FOR EACH ROW EXECUTE PROCEDURE process_stock_movement();

-- F. Tenant-Aware Notifications
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    p_name TEXT;
    v_organization_id UUID;
    v_branch_id UUID;
BEGIN
    IF NEW.quantity < 10 THEN
        SELECT name, organization_id INTO p_name, v_organization_id 
        FROM products WHERE id = NEW.product_id;
        
        v_branch_id := NEW.branch_id;
        
        INSERT INTO notifications (user_id, organization_id, branch_id, title, message, type)
        SELECT id, v_organization_id, v_branch_id, 'Low Stock Alert', 
               'Product "' || p_name || '" is low on stock (' || NEW.quantity || ' remaining).', 
               'low_stock'
        FROM profiles
        WHERE ((permissions->>'can_edit_inventory')::boolean = true OR is_super_admin)
          AND organization_id = v_organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_low_stock_notification
AFTER INSERT OR UPDATE ON product_stocks
FOR EACH ROW EXECUTE PROCEDURE notify_low_stock();

CREATE OR REPLACE FUNCTION notify_big_sale()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_id UUID;
    v_organization_id UUID;
BEGIN
    IF NEW.total_amount > 5000 THEN
        v_branch_id := NEW.branch_id;
        
        SELECT organization_id INTO v_organization_id 
        FROM branches WHERE id = v_branch_id;
        
        INSERT INTO notifications (user_id, organization_id, branch_id, title, message, type)
        SELECT id, v_organization_id, v_branch_id, 'Big Sale Achievement', 
               'A new sale of ' || NEW.total_amount || ' EGP has been recorded!', 
               'big_sale'
        FROM profiles
        WHERE ((permissions->>'can_view_reports')::boolean = true OR is_super_admin)
          AND organization_id = v_organization_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_big_sale_notification
AFTER INSERT ON sales
FOR EACH ROW EXECUTE PROCEDURE notify_big_sale();

-- ========================================================
-- 7. ANALYTICS & VIEW FUNCTIONS
-- ========================================================

-- Get warehouse valuation
CREATE OR REPLACE FUNCTION get_warehouse_valuation(w_id UUID)
RETURNS TABLE (total_cost DECIMAL, total_revenue DECIMAL, projected_profit DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ps.quantity * p.cost_price), 0),
    COALESCE(SUM(ps.quantity * p.selling_price), 0),
    COALESCE(SUM(ps.quantity * (p.selling_price - p.cost_price)), 0)
  FROM product_stocks ps
  JOIN products p ON ps.product_id = p.id
  WHERE ps.warehouse_id = w_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ========================================================

-- Master RLS Enabler
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
    EXECUTE 'ALTER TABLE ' || t || ' ENABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;

-- Helper Function for RLS
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

-- RLS Policies Examples (Hierarchy Support)
-- Categories (Org level)
DROP POLICY IF EXISTS "Multi-tenant access for categories" ON categories;
CREATE POLICY "Multi-tenant access for categories" ON categories FOR ALL TO authenticated
USING ( (SELECT is_super_admin FROM get_auth_profile()) OR (organization_id = (SELECT organization_id FROM get_auth_profile())) )
WITH CHECK ( (SELECT is_super_admin FROM get_auth_profile()) OR (organization_id = (SELECT organization_id FROM get_auth_profile())) );

-- Warehouses (Branch level)
DROP POLICY IF EXISTS "Multi-tenant access for warehouses" ON warehouses;
CREATE POLICY "Multi-tenant access for warehouses" ON warehouses FOR ALL TO authenticated
USING ( (SELECT is_super_admin FROM get_auth_profile()) OR (organization_id = (SELECT organization_id FROM get_auth_profile()) AND (branch_id = (SELECT branch_id FROM get_auth_profile()) OR (SELECT branch_id FROM get_auth_profile()) IS NULL)) )
WITH CHECK ( (SELECT is_super_admin FROM get_auth_profile()) OR (organization_id = (SELECT organization_id FROM get_auth_profile()) AND (branch_id = (SELECT branch_id FROM get_auth_profile()) OR (SELECT branch_id FROM get_auth_profile()) IS NULL)) );

-- Products (Org level)
DROP POLICY IF EXISTS "Multi-tenant access for products" ON products;
CREATE POLICY "Multi-tenant access for products" ON products FOR ALL TO authenticated
USING ( (SELECT is_super_admin FROM get_auth_profile()) OR (organization_id = (SELECT organization_id FROM get_auth_profile())) )
WITH CHECK ( (SELECT is_super_admin FROM get_auth_profile()) OR (organization_id = (SELECT organization_id FROM get_auth_profile())) );

-- Product Stocks (Branch level)
DROP POLICY IF EXISTS "Multi-tenant access for product_stocks" ON product_stocks;
CREATE POLICY "Multi-tenant access for product_stocks" ON product_stocks FOR ALL TO authenticated
USING ( (SELECT is_super_admin FROM get_auth_profile()) OR (branch_id = (SELECT branch_id FROM get_auth_profile()) OR (SELECT branch_id FROM get_auth_profile()) IS NULL) )
WITH CHECK ( (SELECT is_super_admin FROM get_auth_profile()) OR (branch_id = (SELECT branch_id FROM get_auth_profile()) OR (SELECT branch_id FROM get_auth_profile()) IS NULL) );

-- Sales (Branch level)
DROP POLICY IF EXISTS "Multi-tenant access for sales" ON sales;
CREATE POLICY "Multi-tenant access for sales" ON sales FOR ALL TO authenticated
USING ( (SELECT is_super_admin FROM get_auth_profile()) OR (branch_id = (SELECT branch_id FROM get_auth_profile())) )
WITH CHECK ( (SELECT is_super_admin FROM get_auth_profile()) OR (branch_id = (SELECT branch_id FROM get_auth_profile())) );

-- Purchase Orders (Branch level)
DROP POLICY IF EXISTS "Multi-tenant access for purchase_orders" ON purchase_orders;
CREATE POLICY "Multi-tenant access for purchase_orders" ON purchase_orders FOR ALL TO authenticated
USING ( (SELECT is_super_admin FROM get_auth_profile()) OR (branch_id = (SELECT branch_id FROM get_auth_profile())) )
WITH CHECK ( (SELECT is_super_admin FROM get_auth_profile()) OR (branch_id = (SELECT branch_id FROM get_auth_profile())) );

-- Notifications (User level + Branch visibility)
DROP POLICY IF EXISTS "Users can only see their own notifications" ON notifications;
CREATE POLICY "Users can only see their own notifications" ON notifications FOR SELECT TO authenticated
USING ( (auth.uid() = user_id) OR (SELECT is_super_admin FROM get_auth_profile()) );

-- ========================================================
-- 9. SEED DEFAULT DATA
-- ========================================================
INSERT INTO organizations (id, name, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO branches (id, organization_id, name, location)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Main Branch', 'Default Location')
ON CONFLICT (id) DO NOTHING;
