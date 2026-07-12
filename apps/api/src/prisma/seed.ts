import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // TODO: add seed data
  const password = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@transitops.com' },
    update: {},
    create: { email: 'admin@transitops.com', password, role: 'FLEET_MANAGER' },
  });
  console.log('Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
