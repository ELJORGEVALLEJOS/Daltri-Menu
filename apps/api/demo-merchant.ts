import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const slug = 'demo';

    console.log(`Checking if merchant '${slug}' exists...`);
    let merchant = await prisma.merchant.findUnique({
        where: { slug },
    });

    if (!merchant) {
        console.log(`Creating merchant '${slug}'...`);
        merchant = await prisma.merchant.create({
            data: {
                slug,
                name: 'Restaurante Demo',
                whatsappNumber: '5491112345678',
                address: 'Calle Falsa 123',
                currency: 'USD',
                isActive: true,
            },
        });
    }

    // Create sample category and items if none
    const categories = await prisma.category.findMany({ where: { merchantId: merchant.id } });
    if (categories.length === 0) {
        console.log('Creating sample menu...');
        await prisma.category.create({
            data: {
                merchantId: merchant.id,
                name: 'Hamburguesas',
                sortOrder: 1,
                isActive: true,
                items: {
                    create: [
                        {
                            name: 'Burger Clásica',
                            description: 'Lechuga, tomate y queso',
                            priceCents: 1200, // 12.00
                            isActive: true,
                        },
                        {
                            name: 'Burger Especial',
                            description: 'Bacon, huevo y cebolla',
                            priceCents: 1500, // 15.00
                            isActive: true,
                        },
                    ],
                },
            },
        });
    }

    console.log('Done! You can now use the slug:', slug);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
