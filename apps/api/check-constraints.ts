import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConstraints() {
    console.log('--- Checking Constraints for Merchant Table ---');
    try {
        const constraints = await prisma.$queryRaw`
      SELECT conname, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'daltri_menu'
      AND conrelid = 'daltri_menu."Merchant"'::regclass;
    `;
        console.log('Constraints:', JSON.stringify(constraints, null, 2));
    } catch (error) {
        console.error('❌ Check failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConstraints();
