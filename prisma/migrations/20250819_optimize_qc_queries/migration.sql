-- Add indexes to optimize QC queries
-- These indexes will improve the performance of QC-related operations

-- Index for QC purchases query - covers qc_required, qc_completed, and supplier_id for tbl_purchases
CREATE INDEX IF NOT EXISTS idx_purchases_qc_supplier ON tbl_purchases (qc_required, qc_completed, supplier_id);

-- Index for QC devices query - covers purchase_id for tbl_imei
CREATE INDEX IF NOT EXISTS idx_imei_purchase_id ON tbl_imei (purchase_id);

-- Index for QC information lookup - covers item_code and purchase_id for tbl_qc_imei_products
CREATE INDEX IF NOT EXISTS idx_qc_imei_item_code_purchase ON tbl_qc_imei_products (item_code, purchase_id);