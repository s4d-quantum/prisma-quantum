-- Create required generated column and indexes (idempotent patterns for MariaDB/MySQL)
-- Note: Use TRY/EXCEPT style via conditional checks to avoid errors if already present.

-- 1) tbl_purchases.tac8 generated column
ALTER TABLE tbl_purchases
  ADD COLUMN IF NOT EXISTS tac8 VARCHAR(8)
  GENERATED ALWAYS AS (LEFT(item_imei, 8)) STORED;

-- 2) Indexes on tbl_purchases
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON tbl_purchases (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_item_imei ON tbl_purchases (item_imei);
CREATE INDEX IF NOT EXISTS idx_purchases_tac8 ON tbl_purchases (tac8);

-- 3) Indexes on tbl_tac
CREATE INDEX IF NOT EXISTS idx_tac_item_tac ON tbl_tac (item_tac);
CREATE INDEX IF NOT EXISTS idx_tac_item_brand ON tbl_tac (item_brand);

-- 4) Indexes on tbl_imei
CREATE INDEX IF NOT EXISTS idx_imei_item_imei ON tbl_imei (item_imei);
CREATE INDEX IF NOT EXISTS idx_imei_status ON tbl_imei (status);
CREATE INDEX IF NOT EXISTS idx_imei_status_imei ON tbl_imei (status, item_imei);

-- 5) Indexes on tbl_categories
CREATE INDEX IF NOT EXISTS idx_categories_category_id ON tbl_categories (category_id);
CREATE INDEX IF NOT EXISTS idx_categories_title ON tbl_categories (title);

-- 6) Indexes on tbl_suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_id ON tbl_suppliers (supplier_id);

-- 7) Indexes on tbl_orders / tbl_imei_sales_orders
CREATE INDEX IF NOT EXISTS idx_orders_item_imei ON tbl_orders (item_imei);
CREATE INDEX IF NOT EXISTS idx_sales_orders_item_code ON tbl_imei_sales_orders (item_code);

-- Views
-- Drop existing to allow CREATE OR REPLACE behavior on MariaDB (older versions don't support OR REPLACE for views)
DROP VIEW IF EXISTS vw_device_overview;
DROP VIEW IF EXISTS vw_sales_order_devices;
DROP VIEW IF EXISTS vw_purchase_order_devices;
DROP VIEW IF EXISTS vw_goods_out_devices;
DROP VIEW IF EXISTS vw_device_counts_by_supplier;
DROP VIEW IF EXISTS vw_device_counts_by_purchase_order;
DROP VIEW IF EXISTS vw_device_counts_by_sales_order;
DROP VIEW IF EXISTS vw_device_counts_by_tray;
DROP VIEW IF EXISTS vw_device_status_summary;
DROP VIEW IF EXISTS vw_device_counts_by_grade;
DROP VIEW IF EXISTS vw_device_supplier;
DROP VIEW IF EXISTS vw_tac;
DROP VIEW IF EXISTS v_purchases_with_tac;
DROP VIEW IF EXISTS v_tac_brand;
DROP VIEW IF EXISTS v_instock_imei;
DROP VIEW IF EXISTS v_suppliers;
DROP VIEW IF EXISTS v_manufacturers;
DROP VIEW IF EXISTS v_instock_by_supplier_brand;

-- Master view
CREATE VIEW vw_device_overview AS
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
    CASE WHEN pur.qc_required = 1 THEN 'Yes' ELSE 'No' END AS qc_required,
    CASE WHEN pur.qc_completed = 1 THEN 'Yes' ELSE 'No' END AS qc_complete,
    CASE WHEN pur.repair_required = 1 THEN 'Yes' ELSE 'No' END AS repair_required,
    CASE WHEN pur.repair_completed = 1 THEN 'Yes' ELSE 'No' END AS repair_complete,
    pur.tray_id AS tray_id
FROM tbl_imei AS imei
LEFT JOIN tbl_tac AS tac ON tac.item_tac = imei.item_tac
LEFT JOIN tbl_categories AS cat ON tac.item_brand = cat.category_id
LEFT JOIN tbl_purchases AS pur ON pur.item_imei = imei.item_imei
LEFT JOIN tbl_suppliers AS sup ON pur.supplier_id = sup.supplier_id
LEFT JOIN tbl_imei_sales_orders AS so ON so.item_code = imei.item_imei
LEFT JOIN tbl_orders AS ord ON ord.item_imei = imei.item_imei;

-- Chained views
CREATE VIEW vw_sales_order_devices AS
SELECT * FROM vw_device_overview WHERE sales_order_id IS NOT NULL;

CREATE VIEW vw_purchase_order_devices AS
SELECT * FROM vw_device_overview WHERE purchase_order_id IS NOT NULL;

CREATE VIEW vw_goods_out_devices AS
SELECT * FROM vw_device_overview WHERE goods_out_order_id IS NOT NULL;

CREATE VIEW vw_device_counts_by_supplier AS
SELECT supplier, COUNT(*) AS total_devices
FROM vw_device_overview
GROUP BY supplier;

CREATE VIEW vw_device_counts_by_purchase_order AS
SELECT purchase_order_id, COUNT(*) AS total_devices
FROM vw_device_overview
WHERE purchase_order_id IS NOT NULL
GROUP BY purchase_order_id;

CREATE VIEW vw_device_counts_by_sales_order AS
SELECT sales_order_id, COUNT(*) AS total_devices
FROM vw_device_overview
WHERE sales_order_id IS NOT NULL
GROUP BY sales_order_id;

CREATE VIEW vw_device_counts_by_tray AS
SELECT tray_id, COUNT(*) AS total_devices
FROM vw_device_overview
WHERE tray_id IS NOT NULL
GROUP BY tray_id;

CREATE VIEW vw_device_status_summary AS
SELECT status, COUNT(*) AS total_devices
FROM vw_device_overview
GROUP BY status;

CREATE VIEW vw_device_counts_by_grade AS
SELECT grade, COUNT(*) AS total_devices
FROM vw_device_overview
GROUP BY grade;

-- Support views
CREATE VIEW vw_device_supplier AS
SELECT
    i.id AS imei_row_id, i.item_imei, i.item_tac, i.item_color, i.item_grade, i.item_gb,
    i.purchase_id AS imei_purchase_id, i.status AS imei_status, i.created_at AS imei_created_at,
    p.id AS purchase_row_id, p.purchase_id AS purchase_number, p.date AS purchase_date,
    p.item_imei AS purchase_item_imei, p.supplier_id AS supplier_code,
    s.id AS supplier_row_id, s.supplier_id AS supplier_code_dup, s.name AS supplier_name,
    s.address AS supplier_address, s.city AS supplier_city, s.country AS supplier_country,
    s.phone AS supplier_phone, s.email AS supplier_email, s.vat AS supplier_vat
FROM tbl_imei i
LEFT JOIN tbl_purchases p ON p.item_imei = i.item_imei
LEFT JOIN tbl_suppliers s ON s.supplier_id = p.supplier_id;

CREATE VIEW vw_tac AS
SELECT
    t.item_tac, t.item_details, t.item_brand AS brand_code, c.title AS brand_title
FROM tbl_tac t
LEFT JOIN tbl_categories c ON c.category_id = t.item_brand;

CREATE VIEW v_purchases_with_tac AS
SELECT
    p.id AS purchase_row_id, p.purchase_id, p.item_imei, p.supplier_id, p.tac8
FROM tbl_purchases p
WHERE p.item_imei IS NOT NULL AND LENGTH(p.item_imei) >= 8;

CREATE VIEW v_tac_brand AS
SELECT t.item_tac AS tac8, t.item_brand
FROM tbl_tac t;

CREATE VIEW v_instock_imei AS
SELECT i.item_imei, i.item_tac, i.status
FROM tbl_imei i
WHERE i.status = 1;

CREATE VIEW v_suppliers AS
SELECT s.supplier_id, s.name
FROM tbl_suppliers s;

CREATE VIEW v_manufacturers AS
SELECT c.category_id, c.title
FROM tbl_categories c;

CREATE VIEW v_instock_by_supplier_brand AS
SELECT p.supplier_id, tb.item_brand, p.item_imei
FROM v_purchases_with_tac p
JOIN v_tac_brand tb ON tb.tac8 = p.tac8
JOIN v_instock_imei ii ON ii.item_imei = p.item_imei;

-- Optional maintenance
ANALYZE TABLE tbl_purchases, tbl_tac, tbl_imei, tbl_categories, tbl_suppliers;