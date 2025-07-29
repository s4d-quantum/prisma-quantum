// Check grade 7
const { PrismaClient } = require('@prisma/client');

async function checkGrades() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "mysql://pgloader:715525@206.189.25.77:3306/s4d_england_db"
      }
    }
  });

  try {
    const allGrades = await prisma.tbl_grades.findMany({
      orderBy: { grade_id: 'asc' }
    });
    console.log('All grades:', allGrades);
    
    // Check a specific IMEI's purchase relationship
    const sampleImei = await prisma.tbl_imei.findFirst({
      select: { item_imei: true, purchase_id: true, item_grade: true }
    });
    console.log('\nSample IMEI:', sampleImei);
    
    if (sampleImei && sampleImei.purchase_id) {
      // Try both relationship approaches
      const purchaseById = await prisma.tbl_purchases.findFirst({
        where: { id: sampleImei.purchase_id },
        select: { supplier_id: true, purchase_id: true, id: true }
      });
      console.log('Purchase by ID:', purchaseById);
      
      const purchaseByPurchaseId = await prisma.tbl_purchases.findFirst({
        where: { purchase_id: sampleImei.purchase_id },
        select: { supplier_id: true, purchase_id: true, id: true }
      });
      console.log('Purchase by purchase_id:', purchaseByPurchaseId);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGrades();
