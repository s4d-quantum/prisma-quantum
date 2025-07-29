const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const imeiProducts = await prisma.tbl_imei.findMany();
    console.log('IMEI Products:', imeiProducts);
  } catch (error) {
    console.error('Error fetching IMEI products:', error);
  } finally {
    await prisma.$disconnect();
  }
}
test();
