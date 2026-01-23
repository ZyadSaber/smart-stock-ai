CREATE OR REPLACE VIEW view_purchase_analytics AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.barcode,
    p.organization_id,
    po.branch_id,
    -- إجمالي الكميات اللي اشتريتها من الصنف ده
    SUM(poi.quantity) AS total_quantity_purchased,
    -- عدد مرات الشراء (عدد فواتير المشتريات)
    COUNT(poi.id) AS purchase_count,
    -- متوسط سعر الشراء (التكلفة) من واقع الفواتير
    ROUND(AVG(poi.unit_price), 2) AS avg_purchase_unit_price,
    -- إجمالي المبلغ المدفوع في الصنف ده
    SUM(poi.total_price) AS total_spent,
    -- آخر سعر اشتريت بيه (عشان تتابع غلاء الأسعار)
    (SELECT unit_price FROM purchase_order_items 
     WHERE product_id = p.id 
     ORDER BY id DESC LIMIT 1) AS last_purchase_price
FROM purchase_order_items poi
JOIN purchase_orders po ON poi.purchase_order_id = po.id
JOIN products p ON poi.product_id = p.id
GROUP BY 
    p.id, 
    p.name, 
    p.barcode, 
    p.organization_id, 
    po.branch_id;

CREATE OR REPLACE VIEW view_top_selling_products AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.barcode,
    p.organization_id,
    s.branch_id,
    SUM(si.quantity) AS total_quantity_sold,
    COUNT(si.id) AS times_sold, -- عدد مرات البيع (عدد الفواتير)
    ROUND(AVG(p.cost_price), 2) AS avg_cost_price,
    ROUND(AVG(si.unit_price), 2) AS avg_actual_selling_price,
    SUM(si.quantity * si.unit_price) AS total_revenue,
    -- حساب صافي الربح التقديري للصنف
    SUM(si.quantity * (si.unit_price - p.cost_price)) AS estimated_profit
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN products p ON si.product_id = p.id
GROUP BY 
    p.id, 
    p.name, 
    p.barcode, 
    p.organization_id, 
    s.branch_id;

CREATE OR REPLACE VIEW view_product_stock_valuation AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    p.cost_price AS last_cost,
    ps.quantity AS stock_level,
    (ps.quantity * p.cost_price) AS total_inventory_value,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    w.branch_id,        -- مهم جداً للفلترة على مستوى الفرع
    p.organization_id,  -- مهم جداً للفلترة على مستوى الشركة (Multi-tenancy)
    c.name AS category_name
FROM product_stocks ps
JOIN products p ON ps.product_id = p.id
JOIN warehouses w ON ps.warehouse_id = w.id
LEFT JOIN categories c ON p.category_id = c.id;