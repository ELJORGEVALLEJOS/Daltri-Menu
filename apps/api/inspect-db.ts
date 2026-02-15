import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectTable() {
    console.log('--- Inspecting Merchant Table ---');
    try {
        const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Merchant'
      AND table_schema = 'daltri_menu';
    `;
        console.log('Columns:', JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error('❌ Inspection failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

inspectTable();
