-- SQL definition for vw_device_overview view
-- This view consolidates device information from multiple tables to simplify lookups

CREATE OR REPLACE VIEW vw_device_overview AS
SELECT 
    i.item_imei AS imei,
    c.title AS manufacturer,
    t.item_details AS model_no,
    i.item_color AS color,
    i.item_gb AS storage,
    CASE 
        WHEN i.item_grade = 1 THEN 'A'
        WHEN i.item_grade = 2 THEN 'B'
        WHEN i.item_grade = 3 THEN 'C'
        WHEN i.item_grade = 4 THEN 'D'
        WHEN i.item_grade = 5 THEN 'E'
        WHEN i.item_grade = 6 THEN 'F'
        ELSE 'N/A'
    END AS grade,
    CASE 
        WHEN i.status = 1 THEN 'In Stock'
        WHEN i.status = 0 THEN 'Out of Stock'
        ELSE 'Unknown'
    END AS status,
    s.name AS supplier,
    so.order_id AS goods_out_order_id,
    iso.order_id AS sales_order_id,
    p.purchase_id AS purchase_order_id,
    CASE 
        WHEN p.qc_required = 1 THEN 'Yes'
        WHEN p.qc_required = 0 THEN 'No'
        ELSE 'N/A'
    END AS qc_required,
    CASE 
        WHEN p.qc_completed = 1 THEN 'Yes'
        WHEN p.qc_completed = 0 THEN 'No'
        ELSE 'N/A'
    END AS qc_complete,
    CASE 
        WHEN p.repair_required = 1 THEN 'Yes'
        WHEN p.repair_required = 0 THEN 'No'
        ELSE 'N/A'
    END AS repair_required,
    CASE 
        WHEN p.repair_completed = 1 THEN 'Yes'
        WHEN p.repair_completed = 0 THEN 'No'
        ELSE 'N/A'
    END AS repair_complete
FROM tbl_imei i
LEFT JOIN tbl_tac t ON i.item_tac = t.item_tac
LEFT JOIN tbl_categories c ON t.item_brand = c.category_id
LEFT JOIN tbl_purchases p ON i.item_imei = p.item_imei
LEFT JOIN tbl_suppliers s ON p.supplier_id = s.supplier_id
LEFT JOIN tbl_orders o ON i.item_imei = o.item_imei
LEFT JOIN tbl_imei_sales_orders iso ON i.item_imei = iso.item_code
LEFT JOIN tbl_orders so ON iso.goodsout_order_id = so.order_id
WHERE i.item_imei IS NOT NULL;