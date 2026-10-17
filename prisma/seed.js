const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters before seeding.');
  }

  const hashed = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed },
    create: {
      email: adminEmail,
      password: hashed,
      name: 'Admin',
      role: 'ADMIN'
    }
  });

  console.log('Seed complete. Admin user:', adminEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
