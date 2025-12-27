-- Function to manage stock updates for Purchase Orders (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION manage_purchase_stock_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: Increase stock
  IF (TG_OP = 'INSERT') THEN
    UPDATE product_stocks
    SET quantity = quantity + NEW.quantity
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
    
    -- If no stock record exists, insert it
    IF NOT FOUND THEN
      INSERT INTO product_stocks (product_id, warehouse_id, quantity)
      VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity);
    END IF;
    
    RETURN NEW;

  -- Handle DELETE: Decrease stock (Reverse the purchase)
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE product_stocks
    SET quantity = quantity - OLD.quantity
    WHERE product_id = OLD.product_id AND warehouse_id = OLD.warehouse_id;
    
    RETURN OLD;

  -- Handle UPDATE: Adjust stock based on difference
  ELSIF (TG_OP = 'UPDATE') THEN
    -- 1. Reverse the OLD quantity
    UPDATE product_stocks
    SET quantity = quantity - OLD.quantity
    WHERE product_id = OLD.product_id AND warehouse_id = OLD.warehouse_id;

    -- 2. Apply the NEW quantity
    UPDATE product_stocks
    SET quantity = quantity + NEW.quantity
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;

    -- If no stock record exists for the NEW update (rare case if changing warehouse), insert it
    IF NOT FOUND THEN
      INSERT INTO product_stocks (product_id, warehouse_id, quantity)
      VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity);
    END IF;

    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (to avoid double counting)
DROP TRIGGER IF EXISTS tr_increase_stock ON purchase_order_items;

-- Create the comprehensive trigger
CREATE TRIGGER tr_manage_purchase_stock
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW EXECUTE PROCEDURE manage_purchase_stock_trigger();
