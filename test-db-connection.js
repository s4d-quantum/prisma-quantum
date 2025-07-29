// Test the database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "mysql://pgloader:715525@206.189.25.77:3306/s4d_england_db"
      }
    }
  });

  try {
    console.log('Testing database connection...');
    
    // Test suppliers
    console.log('\n=== Testing Suppliers ===');
    const suppliers = await prisma.tbl_suppliers.findMany({
      take: 5,
      select: { supplier_id: true, name: true }
    });
    console.log('Suppliers found:', suppliers.length);
    console.log('Sample suppliers:', suppliers);
    
    // Test grades
    console.log('\n=== Testing Grades ===');
    const grades = await prisma.tbl_grades.findMany({
      select: { grade_id: true, title: true }
    });
    console.log('Grades found:', grades.length);
    console.log('All grades:', grades);
    
    // Test a few IMEI records
    console.log('\n=== Testing IMEI Records ===');
    const imeiSample = await prisma.tbl_imei.findMany({
      take: 3,
      select: { item_imei: true, item_grade: true, purchase_id: true }
    });
    console.log('IMEI samples:', imeiSample);
    
    // Test purchases
    console.log('\n=== Testing Purchases ===');
    const purchaseSample = await prisma.tbl_purchases.findMany({
      take: 3,
      select: { item_imei: true, supplier_id: true, purchase_id: true, id: true }
    });
    console.log('Purchase samples:', purchaseSample);
    
  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
