import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function testPasswordFormat() {
  try {
    // Get the first user with their password hash
    const user = await prisma.tbl_accounts.findFirst({
      select: {
        id: true,
        user_name: true,
        user_email: true,
        user_password: true,
        user_role: true
      }
    });
    
    if (user) {
      console.log("Sample user:", {
        id: user.id,
        name: user.user_name,
        email: user.user_email,
        role: user.user_role
      });
      
      console.log("Password hash format:", user.user_password.substring(0, 20) + "...");
      console.log("Hash length:", user.user_password.length);
      console.log("Starts with $2:", user.user_password.startsWith("$2"));
      
      // Try to verify if it's a bcrypt hash
      const isBcryptHash = user.user_password.match(/^\$2[aby]?\$\d+\$/);
      console.log("Appears to be bcrypt hash:", !!isBcryptHash);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordFormat();
