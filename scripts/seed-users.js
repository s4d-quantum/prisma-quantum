import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function seedUsers() {
  const users = [
    { name: 'Phil', email: 'phil@s4dltd.com', role: 'user' },
    { name: 'Vicky', email: 'vicky@s4dltd.com', role: 'user' },
    { name: 'Adam', email: 'adam@s4dltd.com', role: 'user' },
    { name: 'Claire', email: 'claire@s4dltd.com', role: 'user' },
    { name: 'Paul', email: 'paul@s4dltd.com', role: 'user' },
    { name: 'Ben', email: 'ben@s4dltd.com', role: 'user' },
    { name: 'Vitalija', email: 'vitalija@s4dltd.com', role: 'user' },
    { name: 'Rominta', email: 'rominta@s4dltd.com', role: 'user' },
  ];

  const password = '715525';
  const hashedPassword = bcrypt.hashSync(password, 10);

  for (const user of users) {
    try {
      await prisma.tbl_accounts.upsert({
        where: { user_email: user.email },
        update: {
          user_password: hashedPassword,
          user_role: user.role,
        },
        create: {
          user_name: user.name,
          user_email: user.email,
          user_password: hashedPassword,
          user_role: user.role,
          created_at: new Date(),
        },
      });
      console.log(`Created/Updated user: ${user.name}`);
    } catch (error) {
      console.error(`Error creating/updating user ${user.name}:`, error);
    }
  }
}

seedUsers()
  .catch((e) => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
