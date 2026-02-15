import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIndexes() {
    console.log('--- Checking Indexes for Merchant Table ---');
    try {
        const indexes = await prisma.$queryRaw`
      SELECT
          t.relname as table_name,
          i.relname as index_name,
          ix.indisunique as is_unique
      FROM
          pg_class t
          JOIN pg_index ix ON t.oid = ix.indrelid
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE
          t.relkind = 'r'
          AND t.relname = 'Merchant'
          AND n.nspname = 'daltri_menu';
    `;
        console.log('Indexes:', JSON.stringify(indexes, null, 2));
    } catch (error) {
        console.error('❌ Check failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkIndexes();
