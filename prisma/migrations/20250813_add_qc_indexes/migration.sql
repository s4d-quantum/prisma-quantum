-- Create indexes to improve QC module performance
-- These indexes will help speed up the queries in the QC module

-- Index for filtering by qc_required and qc_completed status
CREATE INDEX IF NOT EXISTS idx_purchases_qc_required_completed ON tbl_purchases (qc_required, qc_completed);

-- Index for filtering by qc_required, qc_completed, and purchase_id
CREATE INDEX IF NOT EXISTS idx_purchases_qc_required_completed_purchase_id ON tbl_purchases (qc_required, qc_completed, purchase_id);

-- Index for filtering by qc_required, qc_completed, and supplier_id
CREATE INDEX IF NOT EXISTS idx_purchases_qc_required_completed_supplier_id ON tbl_purchases (qc_required, qc_completed, supplier_id);

-- Index for counting devices by purchase_id
CREATE INDEX IF NOT EXISTS idx_imei_purchase_id ON tbl_imei (purchase_id);