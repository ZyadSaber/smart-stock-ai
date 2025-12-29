-- ========================================================
-- SMART STOCK AI - PRODUCTION DATABASE SCHEMA
-- ========================================================
-- Description: Complete schema including tables, relationships, 
-- functions, triggers, and Row Level Security (RLS).
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CLEANUP (Optional - Use with caution)
-- DROP TABLE IF EXISTS stock_movements;
-- DROP TABLE IF EXISTS purchase_order_items;
-- DROP TABLE IF EXISTS purchase_orders;
-- DROP TABLE IF EXISTS sale_items;
-- DROP TABLE IF EXISTS sales;
-- DROP TABLE IF EXISTS product_stocks;
-- DROP TABLE IF EXISTS products;
-- DROP TABLE IF EXISTS warehouses;
-- DROP TABLE IF EXISTS categories;
-- DROP TABLE IF EXISTS profiles;

-- ========================================================
-- 3. CORE TABLES
-- ========================================================

-- Profiles (Extending Supabase Auth Users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'cashier')) DEFAULT 'cashier',
  permissions JSONB DEFAULT '{
    "can_view_reports": false,
    "can_edit_inventory": false
  }',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warehouses
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Stocks (Inventory Matrix)
CREATE TABLE product_stocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id),
  CONSTRAINT check_quantity_non_negative CHECK (quantity >= 0)
);

-- ========================================================
-- 4. TRANSACTION TABLES
-- ========================================================

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT,
  notes TEXT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  profit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Sale Items (Detailed Invoices)
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL
);

-- Purchase Orders (Vendor Inbound)
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL
);

-- Stock Movements (Internal Transfers)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ========================================================
-- 5. INDEXES FOR PERFORMANCE
-- ========================================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_stocks_product ON product_stocks(product_id);
CREATE INDEX idx_stocks_warehouse ON product_stocks(warehouse_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_po_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_movements_product ON stock_movements(product_id);
CREATE INDEX idx_movements_from ON stock_movements(from_warehouse_id);
CREATE INDEX idx_movements_to ON stock_movements(to_warehouse_id);

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

CREATE TRIGGER tr_update_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_stocks BEFORE UPDATE ON product_stocks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_categories BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_update_warehouses BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- B. Logic for Sales (Deduct Stock)
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

-- C. Logic for Purchases (Add Stock)
CREATE OR REPLACE FUNCTION increase_stock_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_stocks
  SET quantity = quantity + NEW.quantity
  WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
  
  IF NOT FOUND THEN
    INSERT INTO product_stocks (product_id, warehouse_id, quantity)
    VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_increase_stock AFTER INSERT ON purchase_order_items
FOR EACH ROW EXECUTE PROCEDURE increase_stock_after_purchase();

-- D. Logic for Stock Movements (Internal Transfers)
CREATE OR REPLACE FUNCTION process_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE: Reverse the movement
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

  -- Handle UPDATE: Correct the difference
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Reverse OLD
    IF OLD.from_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity + OLD.quantity
      WHERE product_id = OLD.product_id AND warehouse_id = OLD.from_warehouse_id;
    END IF;
    IF OLD.to_warehouse_id IS NOT NULL THEN
      UPDATE product_stocks SET quantity = quantity - OLD.quantity
      WHERE product_id = OLD.product_id AND warehouse_id = OLD.to_warehouse_id;
    END IF;
    -- Apply NEW
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

  -- Handle INSERT: Regular movement
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
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
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

-- General SELECT access for all authenticated users
CREATE POLICY "Select access for all authenticated users" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Select access for all authenticated users" ON warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Select access for all authenticated users" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Select access for all authenticated users" ON product_stocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Select access for all authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Select access for all authenticated users" ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Select access for all authenticated users" ON purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Select access for all authenticated users" ON purchase_order_items FOR SELECT TO authenticated USING (true);

-- CRUD access for all authenticated users (Simplified for now - can be refined by role)
CREATE POLICY "Full access for authenticated users on categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated users on warehouses" ON warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated users on products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated users on profiles" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated users on product_stocks" ON product_stocks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated users on stock_movements" ON stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated users on purchase_orders" ON purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated users on purchase_order_items" ON purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
