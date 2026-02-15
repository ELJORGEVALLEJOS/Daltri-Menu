import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSlug() {
    const slug = '1234';
    console.log(`--- Checking slug: ${slug} ---`);

    try {
        const merchant = await prisma.merchant.findUnique({
            where: { slug: slug.toLowerCase() },
        });

        if (merchant) {
            console.log('✅ Merchant exists:', merchant.name, '(' + merchant.id + ')');
        } else {
            console.log('❌ Merchant does NOT exist');
        }
    } catch (error) {
        console.error('❌ Query failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSlug();
