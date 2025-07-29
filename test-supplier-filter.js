// Test script to verify supplier filter logic
console.log('Testing supplier filter logic...');

// Simulate the supplier filter logic
function testSupplierFilter() {
  // Mock data similar to what we'd get from database
  const supplierPurchases = [
    { purchase_id: 1001, item_imei: '123456789012345' },
    { purchase_id: 1002, item_imei: '123456789012346' },
    { purchase_id: 1003, item_imei: null },
    { purchase_id: 1004, item_imei: '' },
    { purchase_id: 1005, item_imei: '123456789012347' }
  ];

  const supplierPurchaseIds = supplierPurchases.map((p) => p.purchase_id);
  const supplierImeis = supplierPurchases
    .map((p) => p.item_imei)
    .filter((imei) => imei !== null && imei !== '');

  console.log('Supplier Purchase IDs:', supplierPurchaseIds);
  console.log('Supplier IMEIs:', supplierImeis);

  // Mock existing filters
  const where = {
    status: 1,
    item_gb: '128',
    OR: [
      { item_imei: { contains: 'search_term' } }
    ]
  };

  // Build the supplier filter - need to combine with existing filters properly
  const baseFilters = [];
  
  // Add existing filters to baseFilters
  if (where.status !== undefined) baseFilters.push({ status: where.status });
  if (where.item_gb) baseFilters.push({ item_gb: where.item_gb });
  if (where.item_color) baseFilters.push({ item_color: where.item_color });
  if (where.item_grade !== undefined) baseFilters.push({ item_grade: where.item_grade });
  if (where.OR) baseFilters.push({ OR: where.OR }); // Include search filters
  
  // Create supplier conditions
  const supplierConditions = [];
  
  // Match by purchase_id
  if (supplierPurchaseIds.length > 0) {
    supplierConditions.push({
      purchase_id: {
        in: supplierPurchaseIds
      }
    });
  }
  
  // Match by IMEI
  if (supplierImeis.length > 0) {
    supplierConditions.push({
      item_imei: {
        in: supplierImeis
      }
    });
  }
  
  // Combine all conditions
  const supplierWhere = {
    AND: [
      ...baseFilters,
      {
        OR: supplierConditions
      }
    ]
  };

  console.log('Final where clause:', JSON.stringify(supplierWhere, null, 2));
}

testSupplierFilter();
