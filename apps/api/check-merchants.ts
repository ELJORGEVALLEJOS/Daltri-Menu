
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const merchants = await prisma.merchant.findMany();
        if (merchants.length > 0) {
            console.log('Existing Merchants:');
            merchants.forEach(m => console.log(`- Name: ${m.name}, Slug: ${m.slug}`));
        } else {
            console.log('No merchants found. Creating demo merchant...');
            const demo = await prisma.merchant.create({
                data: {
                    name: 'Daltri Demo',
                    slug: 'demo',
                    whatsappNumber: '5491112345678',
                    isActive: true,
                    address: '123 Demo St',
                    currency: 'USD',
                }
            });
            console.log('Created Demo Merchant:', { name: demo.name, slug: demo.slug });
        }
    } catch (error) {
        console.error('Error querying merchants:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
