import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SUPER_ADMIN_FULL_NAME ?? 'Super Admin';

  if (!email || !password) {
    throw new Error(
      'Missing SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD in environment',
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      fullName,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log(`Seeded super admin user: ${user.email}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
