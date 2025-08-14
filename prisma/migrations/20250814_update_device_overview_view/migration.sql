-- Update vw_device_overview view with latest version
-- This view provides a comprehensive overview of device information
-- including purchase, supplier, QC, and sales order details

-- Drop existing view to allow CREATE OR REPLACE behavior
DROP VIEW IF EXISTS vw_device_overview;

-- Create the updated view with latest version
CREATE OR REPLACE VIEW vw_device_overview AS
WITH latest_purchases AS (
    SELECT item_imei, MAX(date) AS latest_date
    FROM tbl_purchases
    GROUP BY item_imei
),
latest_qc AS (
    SELECT item_code, MAX(id) AS latest_qc_id
    FROM tbl_qc_imei_products
    GROUP BY item_code
)
SELECT
    imei.item_imei AS imei,
    cat.title AS manufacturer,
    tac.item_details AS model_no,
    imei.item_color AS color,
    imei.item_gb AS storage,
    CASE
        WHEN imei.item_grade = 1 THEN 'A'
        WHEN imei.item_grade = 2 THEN 'B'
        WHEN imei.item_grade = 3 THEN 'C'
        WHEN imei.item_grade = 4 THEN 'D'
        WHEN imei.item_grade = 5 THEN 'E'
        WHEN imei.item_grade = 6 THEN 'F'
        ELSE 'NA'
    END AS grade,
    CASE
        WHEN imei.status = 1 THEN 'In Stock'
        ELSE 'Out of Stock'
    END AS status,
    sup.name AS supplier,
    ord.order_id AS goods_out_order_id,
    so.order_id AS sales_order_id,
    pur.purchase_id AS purchase_order_id,
    pur.date AS purchase_date,
    CASE WHEN pur.qc_required = 1 THEN 'Yes' ELSE 'No' END AS qc_required,
    CASE WHEN pur.qc_completed = 1 THEN 'Yes' ELSE 'No' END AS qc_complete,
    CASE WHEN pur.repair_required = 1 THEN 'Yes' ELSE 'No' END AS repair_required,
    CASE WHEN pur.repair_completed = 1 THEN 'Yes' ELSE 'No' END AS repair_complete,
    qc.item_cosmetic_passed,
    qc.item_functional_passed,
    pur.tray_id AS tray_id,

    CASE
        WHEN imei.status = 1
         AND (
            pur.qc_required = 0
            OR (pur.qc_required = 1 AND pur.qc_completed = 1)
         )
         AND (
            pur.repair_required = 0
            OR (pur.repair_required = 1 AND pur.repair_completed = 1)
         )
         AND qc.item_cosmetic_passed = 1
         AND qc.item_functional_passed = 1
        THEN 'Available'
        ELSE 'Not Available'
    END AS available_flag

FROM tbl_imei AS imei
LEFT JOIN tbl_tac AS tac 
    ON tac.item_tac = imei.item_tac
LEFT JOIN tbl_categories AS cat 
    ON tac.item_brand = cat.category_id

-- only latest purchase record per device
LEFT JOIN latest_purchases lp 
    ON lp.item_imei = imei.item_imei
LEFT JOIN tbl_purchases AS pur 
    ON pur.item_imei = lp.item_imei AND pur.date = lp.latest_date
LEFT JOIN tbl_suppliers AS sup 
    ON pur.supplier_id = sup.supplier_id

-- only latest QC record per device
LEFT JOIN latest_qc lq 
    ON lq.item_code = imei.item_imei
LEFT JOIN tbl_qc_imei_products AS qc 
    ON qc.item_code = lq.item_code AND qc.id = lq.latest_qc_id

-- sales/order joins (still safe now)
LEFT JOIN tbl_imei_sales_orders AS so 
    ON so.item_code = imei.item_imei
LEFT JOIN tbl_orders AS ord 
    ON ord.item_imei = imei.item_imei;