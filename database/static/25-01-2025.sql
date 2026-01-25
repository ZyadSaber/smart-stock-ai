CREATE OR REPLACE FUNCTION get_branch_sales_stats(
  p_branch_id UUID,
  p_customer_id UUID DEFAULT NULL,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_sales BIGINT,
  total_revenue NUMERIC,
  total_profit NUMERIC,
  avg_invoice_value NUMERIC,
  profit_margin_percent NUMERIC,
  today_count BIGINT,
  yesterday_count BIGINT,
  last_15_days_count BIGINT,
  last_30_days_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(id) AS total_sales,
    
    ROUND(COALESCE(SUM(total_amount), 0)::numeric, 2) AS total_revenue,
    ROUND(COALESCE(SUM(profit_amount), 0)::numeric, 2) AS total_profit,
    
    ROUND(
      (CASE WHEN COUNT(id) > 0 THEN SUM(total_amount) / COUNT(id) ELSE 0 END)::numeric, 
      2
    ) AS avg_invoice_value,
    
    ROUND(
      (CASE WHEN SUM(total_amount) > 0 THEN (SUM(profit_amount) / SUM(total_amount)) * 100 ELSE 0 END)::numeric, 
      2
    ) AS profit_margin_percent,
    
    -- Frequency (Fixed day-to-day comparison)
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today_count,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE - 1) AS yesterday_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '15 days') AS last_15_days_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS last_30_days_count
    
  FROM sales
  WHERE 
    branch_id = p_branch_id
    AND (p_customer_id IS NULL OR customer_id = p_customer_id)
    -- Added Date Range Filtering
    AND (p_from_date IS NULL OR created_at::date >= p_from_date)
    AND (p_to_date IS NULL OR created_at::date <= p_to_date);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE VIEW view_top_selling_customers AS
SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    s.organization_id,
    s.branch_id,
    COUNT(s.id) AS total_invoices,
    ROUND(SUM(s.total_amount)::numeric, 2) AS net_invoices_total,
    ROUND(SUM(s.profit_amount)::numeric, 2) AS total_profit,
    -- Calculate average profit per invoice for deeper insight
    ROUND(
        (CASE WHEN COUNT(s.id) > 0 THEN SUM(s.profit_amount) / COUNT(s.id) ELSE 0 END)::numeric, 
        2
    ) AS avg_profit_per_invoice
FROM sales s
JOIN customers c ON s.customer_id = c.id
-- All non-aggregated columns must be here
GROUP BY c.id, c.name, s.organization_id, s.branch_id
ORDER BY net_invoices_total DESC;

CREATE OR REPLACE FUNCTION get_branch_purchase_stats(
  p_branch_id UUID,
  p_supplier_id UUID DEFAULT NULL,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_purchases BIGINT,
  total_spending NUMERIC, -- This represents the sum of all purchase amounts
  avg_purchase_value NUMERIC,
  today_count BIGINT,
  yesterday_count BIGINT,
  last_15_days_count BIGINT,
  last_30_days_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(id) AS total_purchases,
    
    -- Total Spending rounded to 2 decimal places
    ROUND(COALESCE(SUM(total_amount), 0)::numeric, 2) AS total_spending,
    
    -- Average value per purchase
    ROUND(
      (CASE WHEN COUNT(id) > 0 THEN SUM(total_amount) / COUNT(id) ELSE 0 END)::numeric, 
      2
    ) AS avg_purchase_value,
    
    -- Frequency of purchase orders
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today_count,
    COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE - 1) AS yesterday_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '15 days') AS last_15_days_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS last_30_days_count
    
  FROM purchase_orders
  WHERE 
    branch_id = p_branch_id
    AND (p_supplier_id IS NULL OR supplier_id = p_supplier_id)
    AND (p_from_date IS NULL OR created_at::date >= p_from_date)
    AND (p_to_date IS NULL OR created_at::date <= p_to_date);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW view_top_suppliers_by_purchases AS
SELECT 
    v.id AS supplier_id,
    v.name AS supplier_name,
    po.branch_id,
	v.organization_id,
    COUNT(po.id) AS total_orders,
    ROUND(SUM(po.total_amount)::numeric, 2) AS total_spent,
    -- Calculate average cost per order to understand order volume patterns
    ROUND(
        (CASE WHEN COUNT(po.id) > 0 THEN SUM(po.total_amount) / COUNT(po.id) ELSE 0 END)::numeric, 
        2
    ) AS avg_order_value
FROM purchase_orders po
JOIN suppliers v ON po.supplier_id = v.id
-- Essential for multi-tenant filtering (Branch/Org level)
GROUP BY v.id, v.name, po.branch_id
ORDER BY total_spent DESC;