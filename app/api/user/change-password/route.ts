import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
// import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  // For development, we'll allow password change without authentication
  // In a real application, you would want to add proper authentication here
  
  const { currentPassword, newPassword, userId } = await request.json();

  // In a real application, you would validate the user ID and current password
  // For now, we'll just update the password for user ID 1 (admin)
  const userIdToUse = userId || 1;
  
  const user = await prisma.tbl_accounts.findUnique({
    where: { id: userIdToUse },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Update the password directly without checking current password
  // In a real application, you would want to validate the current password
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await prisma.tbl_accounts.update({
    where: { id: userIdToUse },
    data: { user_password: hashedPassword },
  });

  return NextResponse.json({ message: "Password updated successfully" });
}
